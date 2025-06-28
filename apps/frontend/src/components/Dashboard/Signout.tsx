"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Signout() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    // await authClient.signOut({
    //   fetchOptions: {
    //     onSuccess: () => {
    //       toast.success("Signed out successfully");
    //       router.push("/");
    //     },
    //   },
    // });
    // setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"} variant={"box"}>
          Signout
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 font-mono">
        <DialogHeader className="p-6">
          <DialogTitle className="md:text-xl">Confirm Sign Out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out of your account?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full border-t grid grid-cols-2 gap-0">
          <button
            className={`py-4 w-full font-semibold leading-none hover:bg-secondary/30 border-r cursor-pointer`}
            type="button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`w-full font-semibold leading-none bg-orange-600 hover:bg-orange-500 text-white cursor-pointer`}
            onClick={handleSignOut}
          >
            Yes, Sign Out
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
