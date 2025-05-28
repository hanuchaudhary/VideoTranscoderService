import React from "react";
import RegisterPage from "./RegisterPage";
import LandingNavbar from "@/components/Landing/LandingNavbar";

export default function page() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <LandingNavbar />
      <RegisterPage />
      <div className="flex flex-col items-end absolute dark:opacity-100 opacity-50 -right-10 -bottom-50 md:-right-60 md:-bottom-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
      </div>
    </div>
  );
}
