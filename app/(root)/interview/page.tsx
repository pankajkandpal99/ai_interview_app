import Agent from "@/components/general/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <h3 className="">Interview generation</h3>

      <Agent
        userName={user?.name ?? ""}
        userId={user?.id}
        profileImage={user?.profileImage}
        type="generate"
      />
    </>
  );
};

export default Page;
