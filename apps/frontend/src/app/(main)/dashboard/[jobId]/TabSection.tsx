"use client";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import {
  useRouteStore,
  type singleTranscodingJobState,
} from "@/store/routeStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import React from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { JobLog, JobStatus } from "@repo/common/types";

interface SocketLog {
  logLevel: string;
  logMessage: string;
  createdAt: string;
  jobId?: string;
  videoId?: string;
  status?: string;
  duration?: string;
  outputKeys?: string;
}

interface Mergelogs extends JobLog {
  videoId?: string;
  status?: string;
  duration?: string;
  outputKeys?: string;
}

export const TabSection = (singleTranscodingJob: singleTranscodingJobState) => {
  const { setSingleTranscodingJob } = useRouteStore();
  const [activeTab, setActiveTab] = React.useState<"logs" | "export">("logs");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [socketLogs, setSocketLogs] = React.useState<Mergelogs[]>(
    singleTranscodingJob.logs || []
  );
  const socketRef = React.useRef<Socket | null>(null);

  const parsedExportData = JSON.parse(
    singleTranscodingJob.outputS3Keys || "[]"
  );
  //   [
  //   'videos/f8286d09-dc37-49ca-9245-7c94a20a37e0/144p.mp4',
  //   'videos/f8286d09-dc37-49ca-9245-7c94a20a37e0/240p.mp4',
  //   'videos/f8286d09-dc37-49ca-9245-7c94a20a37e0/360p.mp4'
  // ]

  const exportedVideosResolutions: { videoKey: string; resolution: string }[] =
    parsedExportData.map((videoKey: string) => {
      const resolutionMatch = videoKey.match(/\/(\d+p)\.mp4$/);
      const resolution = resolutionMatch ? resolutionMatch[1] : "unknown";
      return { videoKey, resolution };
    });

  React.useEffect(() => {
    if (scrollRef.current && activeTab === "logs") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [socketLogs, activeTab]);

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

  // Initialize WebSocket connection
  React.useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
      socketRef.current?.emit("SubscribeToJob", singleTranscodingJob.id);
    });

    socketRef.current.on("log", (log) => {
      if (log.status === "COMPLETED") {
        setSingleTranscodingJob({
          ...singleTranscodingJob,
          status: JobStatus.COMPLETED,
          completeDuration: log.duration,
          outputS3Keys: log.outputKeys,
        });
        toast.success("Transcoding job completed successfully!");
      }
      if (log.status === "FAILED") {
        setSingleTranscodingJob({
          ...singleTranscodingJob,
          status: JobStatus.FAILED,
        });
        toast.error("Transcoding job failed!");
      }
      if (log.status === "STARTED") {
        setSingleTranscodingJob({
          ...singleTranscodingJob,
          status: JobStatus.PROCESSING,
        });
      }
      setSocketLogs((prevLogs) => [...prevLogs, log]);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      socketRef.current?.emit("UnsubscribeFromJob", singleTranscodingJob.id);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [singleTranscodingJob.id]);

  const downloadVideo = async (resolutionKey: string, jobId: string) => {
    if (!jobId || !resolutionKey) {
      console.error("Job ID is required for downloading video");
      toast.error(
        "Job ID and resolution key are required for downloading video"
      );
      return;
    }
    const url = `${BACKEND_URL}/api/v1/transcoding/download/${jobId}?resolutionKey=${encodeURIComponent(resolutionKey)}`;
    const response = await axios.get(url, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { downloadUrl } = response.data;
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = resolutionKey.split("/").pop() || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Download URL not found in response");
      toast.error("Failed to get download URL for the video");
    }
  };

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
        <div ref={scrollRef} className="space-y-2">
          {activeTab === "logs" && (
            <div className="space-y-2 flex flex-col font-mono text-sm">
              {socketLogs?.length === 0 ? (
                <span className="text-muted-foreground">
                  No logs available for this video.
                </span>
              ) : (
                socketLogs?.map((log, index) => (
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
            </div>
          )}
          {activeTab === "export" && (
            <div>
              <div className="space-y-4 mt-4">
                <ul className="space-y-2">
                  {exportedVideosResolutions.length === 0 ? (
                    <li className="text-muted-foreground">
                      No exported videos available.
                    </li>
                  ) : (
                    exportedVideosResolutions.map((video, index) => (
                      <li
                        onClick={() =>
                          downloadVideo(
                            video.videoKey,
                            singleTranscodingJob.id!
                          )
                        }
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-muted-foreground">
                          {video.resolution}
                        </span>
                        <Button variant={"box"}>Download</Button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
