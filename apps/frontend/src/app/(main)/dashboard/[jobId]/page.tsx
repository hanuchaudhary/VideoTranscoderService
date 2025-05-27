import React from "react";
import { DashboardDetailPage } from "./DashboardDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <div className="relative min-h-screen ">
      <DashboardDetailPage jobId={jobId} />
      <div className="flex flex-col items-end absolute dark:opacity-100 opacity-50 -right-60 -bottom-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-10 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-10 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-10 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
      </div>
    </div>
  );
}
