import React from "react";
import { Logo } from "../Logo";
import Link from "next/link";
import { ThemeSwitcher } from "../ThemeToggle";
import { Signout } from "./Signout";

export function DashboardNavbar() {
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
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Logo />
      <Signout />
      </div>
    </div>
  );
}
