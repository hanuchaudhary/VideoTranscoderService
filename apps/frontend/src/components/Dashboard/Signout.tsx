"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";

export function Signout() {
  const router = useRouter();
  return (
    <Button
      size={"sm"}
      variant={"outline"}
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              toast.success("Signed out successfully");
              router.push("/");
            },
          },
        });
      }}
    >
      Signout
    </Button>
  );
}
