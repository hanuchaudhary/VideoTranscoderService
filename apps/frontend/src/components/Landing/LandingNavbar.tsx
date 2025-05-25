"use client";

import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Logo } from "../Logo";
import { authClient } from "@/lib/authClient";

export default function LandingNavbar() {
  const { data } = authClient.useSession();
  return (
    <header className="fixed w-full left-0 top-0 z-[60] dark:bg-black/80 backdrop-blur-xl bg-white/80">
      <div className="md:px-8 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link className="flex items-center justify-center gap-1.5" href={"/"}>
            <Logo />
            <span className="md:text-xl text-lg font-semibold">Voxer</span>
            <span className="bg-secondary px-2 py-0.5 border text-xs font-medium text-muted-foreground">
              beta
            </span>
          </Link>
        </div>
        <div className="flex gap-2">
          {!data?.session ? (
            <>
              <Link href={"/signin"}>
                <Button variant={"outline"} size={"sm"}>
                  Login
                </Button>
              </Link>
              <Link href={"/register"}>
                <Button variant="default" size={"sm"}>
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <Logo />
          )}
        </div>
      </div>
    </header>
  );
}
