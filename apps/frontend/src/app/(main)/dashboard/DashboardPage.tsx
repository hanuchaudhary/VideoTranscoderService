"use client";
import { authClient } from "@/lib/authClient";
import React from "react";
import { DashboardTable } from "./DashboardTable";

export function DashboardPage() {
  const { data } = authClient.useSession();
  return (
    <div>
      <div className="border-b my-3">
        <h1 className="font-semibold text-2xl leading-none">Dashboard</h1>
        <p className=" pb-3 text-muted-foreground">{data?.user.name}</p>
      </div>
      <div className="my-6 flex items-center justify-between">
        <h3 className="font-semibold text-4xl leading-none">Assets</h3>
        <button className="border flex px-7 py-3 rounded-full transition-colors font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer border-primary">
            Upload new asset
        </button>
      </div>
      <div>
        <DashboardTable/>
      </div>
    </div>
  );
}
