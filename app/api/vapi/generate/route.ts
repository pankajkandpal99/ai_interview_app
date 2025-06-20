/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";
import { Interview } from "@/types";

interface InterviewRequest {
  type: "technical" | "behavioral" | "balanced";
  role: string;
  level: "junior" | "mid" | "senior";
  techstack: string;
  amount: number;
  userId: string;
}

interface InterviewStats {
  totalQuestions: number;
  technicalCount: number;
}

interface InterviewResponse extends Omit<Interview, "id"> {
  stats: InterviewStats;
}

export async function GET() {
  return Response.json(
    {
      success: true,
      data: "Interview question generator API is running",
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  if (request.headers.get("content-type") !== "application/json") {
    return Response.json(
      {
        success: false,
        error: "Invalid content-type. Expected application/json",
      },
      { status: 415 }
    );
  }

  // Parse request body
  let requestData: Partial<InterviewRequest>;
  try {
    requestData = await request.json();
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error,
      },
      { status: 400 }
    );
  }

  const {
    type = "balanced",
    role = "",
    level = "mid",
    techstack = "",
    amount = 5,
    userId = "",
  } = requestData;

  if (!role.trim() || !techstack.trim() || !userId.trim()) {
    return Response.json(
      {
        success: false,
        error: "Missing required fields (role, techstack, userId)",
      },
      { status: 400 }
    );
  }

  const questionAmount = Math.min(
    Math.max(parseInt(amount.toString()) || 5, 1),
    20
  );

  // Generate the AI prompt
  const prompt = `
    Generate ${questionAmount} interview questions for a ${level.toLowerCase()} ${role.trim()} position.
    Required technical skills: ${techstack}.
    Question type emphasis: ${type}.
    
    Requirements:
    - Return only a JSON array of questions: ["question1", "question2"]
    - No additional text or explanations
    - Avoid special characters that might interfere with text-to-speech
    - Include ${
      type === "technical"
        ? "mostly technical"
        : type === "behavioral"
        ? "mostly behavioral"
        : "balanced"
    } questions
    - For senior roles, include system design/architecture questions
    - For junior roles, include learning/growth questions
    - Include at least 2 questions specifically about ${techstack
      .split(",")[0]
      .trim()}
    
    Examples for reference:
    Technical: ["How would you optimize a slow React component?", "Explain the virtual DOM"]
    Behavioral: ["Describe a time you resolved a team conflict", "How do you prioritize tasks under tight deadlines?"]
  `;

  // Generate questions using AI
  let questionList: string[];
  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
      topP: 0.9,
      system:
        "You are an expert technical recruiter generating clear, concise interview questions",
    });

    // Parse and clean the generated questions
    const parsed = JSON.parse(questions);
    questionList = Array.isArray(parsed)
      ? parsed.filter((q: any) => typeof q === "string" && q.trim().length > 0)
      : [questions.toString()];

    questionList = questionList
      .map((q) => q.replace(/["\[\]\/\\*]/g, "").trim())
      .slice(0, questionAmount);
  } catch (error) {
    console.error("AI generation or parsing failed:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to generate valid questions",
      },
      { status: 500 }
    );
  }

  // Count technical questions for analytics
  const technicalKeywords = [
    "how",
    "explain",
    "what",
    "why",
    "implement",
    ...techstack.toLowerCase().split(","),
  ];
  const technicalCount = questionList.filter((q) =>
    technicalKeywords.some((keyword) =>
      q.toLowerCase().includes(keyword.trim())
    )
  ).length;

  // Create interview object
  const interview: Omit<Interview, "id"> & { stats: InterviewStats } = {
    role: role.trim(),
    type: type.toLowerCase(),
    level: level.toLowerCase(),
    techstack: techstack
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t),
    questions: questionList,
    userId,
    finalized: true,
    coverImage: getRandomInterviewCover(),
    createdAt: new Date().toISOString(),
    // updatedAt: new Date().toISOString(),
    stats: {
      totalQuestions: questionList.length,
      technicalCount,
    },
  };

  // Save to database
  try {
    const docRef = await db.collection("interview").add(interview);
    const responseData: InterviewResponse = {
      ...interview,
      stats: interview.stats,
    };

    return Response.json(
      {
        success: true,
        interviewId: docRef.id,
        ...responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Firestore save failed:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to save interview to database",
      },
      { status: 500 }
    );
  }
}

// import { generateText } from "ai";
// import { google } from "@ai-sdk/google";

// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";

// export async function POST(request: Request) {
//   const { type, role, level, techstack, amount, userid } = await request.json();

//   try {
//     const { text: questions } = await generateText({
//       model: google("gemini-2.0-flash-001"),
//       prompt: `Prepare questions for a job interview.
//         The job role is ${role}.
//         The job experience level is ${level}.
//         The tech stack used in the job is: ${techstack}.
//         The focus between behavioural and technical questions should lean towards: ${type}.
//         The amount of questions required is: ${amount}.
//         Please return only the questions, without any additional text.
//         The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//         Return the questions formatted like this:
//         ["Question 1", "Question 2", "Question 3"]

//         Thank you! <3
//     `,
//     });

//     const interview = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(","),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection("interviews").add(interview);

//     return Response.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

// export async function GET() {
//   return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
// }
