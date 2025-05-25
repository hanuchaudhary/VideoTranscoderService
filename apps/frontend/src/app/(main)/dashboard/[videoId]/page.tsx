import React from "react";
import { DashboardDetailPage } from "./DashboardDetailPage";

export default async function page({ params }: { params: { videoId: string } }) {
  // Simulate awaiting params if necessary
  const awaitedParams = await Promise.resolve(params);

  return <DashboardDetailPage params={awaitedParams} />;
}
