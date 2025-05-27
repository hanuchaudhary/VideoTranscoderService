import React from "react";
import { DashboardPage } from "./DashboardPage";

export default function page() {
  return (
    <div className="relative overflow-hidden h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <DashboardPage />
      </div>
      <div className="flex flex-col items-end absolute dark:opacity-100 opacity-50 -right-60 -bottom-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
      </div>
    </div>
  );
}
