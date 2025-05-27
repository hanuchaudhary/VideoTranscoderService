"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouteStore } from "@/store/routeStore";
import { ChevronRight, Loader2 } from "lucide-react";
import { JobLog } from "@repo/common/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardDetailPage({ jobId }: { jobId: string }) {
  console.log("DashboardDetailPage jobId:", jobId);

  const {
    fetchSingleTranscodingJob,
    singleTranscodingJob,
    isFetchingSingleJob,
    deleteTranscodingJob,
  } = useRouteStore();

  const router = useRouter();

  React.useEffect(() => {
    const fetchData = async () => {
      if (jobId) {
        await fetchSingleTranscodingJob(jobId);
      }
    };
    fetchData();
  }, [jobId, fetchSingleTranscodingJob]);

  if (isFetchingSingleJob) {
    return (
      <section className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  if (!singleTranscodingJob) {
    return (
      <section className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <p>Asset not found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 space-y-6">
      <div>
        <div className="flex items-center mb-4 text-xs select-none">
          <Link
            className="hover:text-foreground text-muted-foreground transition-colors border-b border-primary/70 hover:border-primary leading-4 uppercase"
            href={`/dashboard`}
          >
            Dashboard
          </Link>
          <span className={"[&>svg]:size-3.5"}>{<ChevronRight />}</span>
          <span>{singleTranscodingJob.id}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            {singleTranscodingJob.videoTitle}
          </h1>
          <Button
            onClick={async () => {
              if (deleteTranscodingJob) {
                await deleteTranscodingJob(singleTranscodingJob.id!);
              }
              router.push("/dashboard");
            }}
            variant="box"
          >
            Delete
          </Button>
        </div>

        <div className="flex border">
          <div className="relative w-full max-w-lg h-96 bg-secondary overflow-">
            <video
              src={"singleTranscodingJob.videoUrl"}
              controls={false}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-primary-foreground/50 h-full w-full p-2 flex items-center justify-center font-mono text-muted-foreground font-semibold">
              <span>
                Video Coming Soon...
              </span>
            </div>
          </div>

          <div className="py-4 px-6 w-full text-sm space-y-3 font-mono">
            <Info label="Title" value={singleTranscodingJob.videoTitle} />
            <Info label="Video ID" value={singleTranscodingJob.id} />
            <Info
              label="Created"
              value={new Date(singleTranscodingJob.createdAt).toLocaleString(
                "en-US",
                {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }
              )}
            />
            <Info
              label="Status"
              value={<Badge>{singleTranscodingJob.status}</Badge>}
            />
            <Info
              label="Duration"
              value={`${Number.parseFloat(singleTranscodingJob.videoDuration).toFixed(2)}s`}
            />
            <Info label="Original Quality" value={"1080p"} />
            <Info
              label="Resolutions"
              value={
                singleTranscodingJob.resolutions.map((e) => {
                  return [e, ", "].join("");
                }) || "N/A"
              }
            />
            <Info label="Max Frame Rate" value={"60FPS"} />
            <Info label="Aspect Ratio" value={"16:10"} />
          </div>
        </div>
      </div>

      <TabSection logs={singleTranscodingJob.logs} />
    </section>
  );
}

const TabSection = ({
  logs,
  exportData,
}: {
  logs?: JobLog[];
  exportData?: { title: string; url: string }[];
}) => {
  const [activeTab, setActiveTab] = React.useState<"logs" | "export">("logs");
  const messageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop;
    }
  }, [logs, activeTab]);

  function logLevelToColor(logLevel: string) {
    switch (logLevel) {
      case "INFO":
        return "text-blue-500";
      case "WARN":
        return "text-yellow-500";
      case "ERROR":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }

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
      <ScrollArea className="p-4 h-96">
        {activeTab === "logs" && (
          <div className="space-y-2 flex flex-col font-mono text-sm">
            {logs?.length === 0 ? (
              <span className="text-muted-foreground">
                No logs available for this video.
              </span>
            ) : (
              logs?.map((log, index) => (
                <span key={index}>
                  <span
                    className={`${logLevelToColor(log.logLevel.toUpperCase())}`}
                  >
                    [{log.logLevel.toUpperCase()}]{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>{" "}
                  - {log.logMessage}
                </span>
              ))
            )}
            <div ref={messageRef} />
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
      </ScrollArea>
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
