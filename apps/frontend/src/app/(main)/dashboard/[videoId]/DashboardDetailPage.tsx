"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const asset = {
  title: "1080p",
  videoId: "JtUsyOrc02kEqcvWU2onjuBFS5jQ3lhvFYNJThN6U5LU",
  createdAt: "05/25/25 01:55 pm",
  status: "Processed",
  duration: "0:15",
  quality: "1080p",
  resolution: "['144p', '240p', '360p', '480p', '720p', '1080p']",
  frameRate: "60.000",
  aspectRatio: "76:135",
  thumbnail: "https://via.placeholder.com/300x168",
  videoUrl: "https://example.com/play/asset",
};

export function DashboardDetailPage({params}: {params: {videoId: string}}) {
  React.useEffect(() => {
    console.log("Fetching details for videoId:", params.videoId);
  }, [params.videoId]);
  return (
    <section className="p-6 space-y-6">
      <div>
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{asset.videoId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{asset.title}</h1>
          <Button variant="box">Delete</Button>
        </div>

        <div className="flex border">
          <div className="w-full max-w-lg h-96 bg-secondary overflow-">
            <video
              src={asset.videoUrl}
              controls
              className="h-full w-full object-cover"
            />
          </div>

          <div className="py-4 px-6 w-full text-sm space-y-3 font-mono">
            <Info label="Title" value={asset.title} />
            <Info label="Video ID" value={asset.videoId} />
            <Info label="Created" value={asset.createdAt} />
            <Info label="Status" value={<Badge>{asset.status}</Badge>} />
            <Info label="Duration" value={asset.duration} />
            <Info label="Original Quality" value={asset.quality} />
            <Info label="Resolutions" value={asset.resolution} />
            <Info label="Max Frame Rate" value={asset.frameRate} />
            <Info label="Aspect Ratio" value={asset.aspectRatio} />
          </div>
        </div>
      </div>

      <TabSection />
    </section>
  );
}

const TabSection = () => {
  const [activeTab, setActiveTab] = React.useState<"logs" | "export">("logs");

  return (
    <div className="flex flex-col border">
      <div className="w-full flex justify-around items-center border-b font-semibold">
        <button
          className={`hover:bg-secondary/30 py-4 w-full ${
            activeTab === "logs"
              ? "bg-secondary/40 border-b-3 border-primary"
              : ""
          }`}
          onClick={() => setActiveTab("logs")}
        >
          Event Logs
        </button>
        <button
          className={`hover:bg-secondary/30 py-4 w-full ${
            activeTab === "export"
              ? "bg-secondary/40 border-b-3 border-primary"
              : ""
          }`}
          onClick={() => setActiveTab("export")}
        >
          Export
        </button>
      </div>
      <div className="p-4 min-h-96">
        {activeTab === "logs" && (
          <div>
            <div className="space-y-2 flex flex-col font-mono text-sm">
              <span>
                <span>2023-10-01 12:00:00</span> - Video processing started
              </span>
              <span>
                <span>2023-10-01 12:05:00</span> - Video processing completed
              </span>
              <span>
                <span>2023-10-01 12:10:00</span> - Video uploaded to storage
              </span>
              <span>
                <span>2023-10-01 12:00:00</span> - Video processing started
              </span>
              <span>
                <span>2023-10-01 12:05:00</span> - Video processing completed
              </span>
              <span>
                <span>2023-10-01 12:10:00</span> - Video uploaded to storage
              </span>
            </div>
          </div>
        )}
        {activeTab === "export" && (
          <div>
            <div className="space-y-4 mt-4">
              <ul className="space-y-2">
                {[
                  { title: "Video 1", url: "https://example.com/video1" },
                  { title: "Video 2", url: "https://example.com/video2" },
                  { title: "Video 3", url: "https://example.com/video3" },
                ].map((video, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{video.title}</span>
                    <Button
                      variant="box"
                      onClick={() => window.open(video.url, "_blank")}
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 justify-between gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-medium text-left">{value}</span>
    </div>
  );
}
