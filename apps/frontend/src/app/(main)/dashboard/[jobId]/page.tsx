import React from "react";
import { DashboardDetailPage } from "./DashboardDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <DashboardDetailPage jobId={jobId} />;
}
