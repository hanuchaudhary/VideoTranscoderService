"use client";

import { authClient } from "@/lib/authClient";
import React from "react";
import { DashboardTable } from "./DashboardTable";

export function DashboardPage() {
  const { data } = authClient.useSession();
  return (
    <div>
      <div className="border-b my-3 font-mono">
        <h1 className="font-semibold text-2xl leading-none">Dashboard</h1>
        <p className=" pb-3 text-muted-foreground">{data?.user.name}</p>
      </div>
      <div className="">
        <DashboardTable />
      </div>
    </div>
  );
}
