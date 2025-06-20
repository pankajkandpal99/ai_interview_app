import Vapi from "@vapi-ai/web";

const VAPI_KEY = process.env.VAPI_PUBLIC_API_KEY!;

export const vapi = new Vapi(VAPI_KEY);
