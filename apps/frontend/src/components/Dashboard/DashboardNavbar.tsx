"use client";

import React from "react";
import { Logo } from "../Logo";
import Link from "next/link";
import { ThemeSwitcher } from "../ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { authClient } from "@/lib/authClient";

export function DashboardNavbar() {
  const { data } = authClient.useSession();

  return (
    <div className="w-full flex items-center justify-between py-4 px-6">
      <Link
        href={"/"}
        className="relative flex  items-center justify-center gap-1.5"
      >
        <Logo />
        <h1 className="text-xl font-semibold leading-none relative z-20">
          Voxer
        </h1>
      </Link>
      <div className="flex items-center gap-2 font-mono">
        <ThemeSwitcher />
        {data?.session && (
          <>
            <Link
              href={"/profile"}
              className="border px-3 py-2 flex items-center gap-2 font-medium text-muted-foreground bg-secondary/30 cursor-pointer"
            >
              <Avatar>
                <AvatarImage
                  src={data.user.image || "/avatar.jpeg"}
                  alt="avatar"
                />
                <AvatarFallback>K</AvatarFallback>
              </Avatar>
              @{data.user.name}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
