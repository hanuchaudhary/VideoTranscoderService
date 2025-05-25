"use client";

import { useRouteStore } from "@/store/routeStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type DashboardTableData = {
  id: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  videoUrl: string;
  videoCreatedAt: string;
  status: "Processing" | "Completed" | "Failed" | "Pending";
};

export function DashboardTable() {
  const { fetchTranscodingJobs, transcodingJobs } = useRouteStore();
  React.useEffect(() => {
    fetchTranscodingJobs();
  }, []);

  const data: DashboardTableData[] = [
    {
      id: "kaanwdkaldjljdwwlmldnlnwdnankdnk",
      videoTitle: "Sample Video",
      videoDuration: "5:00",
      videoThumbnail:
        "https://images.unsplash.com/photo-1747913647304-9f298ff28ff4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8",
      videoUrl: "https://example.com/video/1",
      videoCreatedAt: "2023-10-01T12:00:00Z",
      status: "Completed",
    },
    {
      id: "wdckncndkcncndkncndkncndkncndkn",
      videoTitle: "Sample Video",
      videoDuration: "5:00",
      videoThumbnail:
        "https://images.unsplash.com/photo-1747913647304-9f298ff28ff4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8",
      videoUrl: "https://example.com/video/1",
      videoCreatedAt: "2023-10-01T12:00:00Z",
      status: "Completed",
    },
  ];

  const router = useRouter();

  return (
    <div className="">
      <table className="min-w-full border-collapse w-full">
        <thead>
          <tr className="border-b text-right">
            <th className="py-3 px-4"></th>
            <th className="py-3 px-4 font-normal text-sm text-left">
              TITLE / ID
            </th>
            <th className="py-3 px-4 font-normal text-sm">DURATION</th>
            <th className="py-3 px-4 font-normal text-sm">STATUS</th>
            <th className="py-3 px-4 font-normal text-sm">CREATED</th>
          </tr>
        </thead>
        <tbody>
          {transcodingJobs.map((item) => (
            <tr
              onClick={() => router.push(`/dashboard/${item.id}`)}
              key={item.id}
              className="border-b hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <td className="py-6 px-4">
                {/* Uncomment if you want to display thumbnails */}
                <img
                  src={"https://images.unsplash.com/photo-1747913647304-9f298ff28ff4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8"}
                  alt={item.videoTitle}
                  className="h-10 object-cover bg-secondary"
                />
              </td>
              <td className="py-6 px-4">
                <Link href={`/dashboard/${item.id}`}>
                  <div className="font-medium">{item.videoTitle}</div>
                  <div className="text-sm text-muted-foreground break-all">
                    {item.id}
                  </div>
                </Link>
              </td>
                <td className="py-6 px-4 text-right font-mono">
                {parseFloat(item.videoDuration).toFixed(2)}s
                </td>
              <td className="py-6 px-4 text-right font-semibold">
                {item.status}
              </td>
              <td className="py-6 px-4 text-right font-mono">
                {new Date(item.createdAt).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
