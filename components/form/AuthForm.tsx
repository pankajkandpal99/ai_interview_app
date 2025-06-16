"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { formSchema, FormSchemaType } from "../../schema/authSchema";
import { Form } from "../ui/form";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import CustomFormField from "./FormField";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthFormProps } from "@/types";

const AuthForm = ({ type }: AuthFormProps) => {
  const router = useRouter();

  const isSignIn = type === "sign-in";

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      // username: "",
    },
  });

  const onSubmit = (data: FormSchemaType) => {
    console.log("data : ", data);
    try {
      if (type === "sign-up") {
        toast.success("Account created successfully. Please Sign in");
        router.push("/sign-in");
      } else {
        toast.success("Sign in successfully.");
        router.push("/");
      }
    } catch (error) {
      console.error("Error in your Auth Form : ", error);
      toast.error(`There was an error : ${error}`);
    }
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-4 card pt-8 pb-6 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3 className="text-primary-100 text-center">
          Practise job interview with AI
        </h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4 w-full form"
            noValidate
          >
            {!isSignIn && (
              <CustomFormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <CustomFormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <CustomFormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
