"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouteStore } from "@/store/routeStore";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TabSection } from "./TabSection";

export function DashboardDetailPage({ jobId }: { jobId: string }) {
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
  }, [jobId]);

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
      <section className="p-6 space-y-6 relative h-[calc(100vh-6rem)]">
        <div className="flex items-center font-mono text-2xl justify-center min-h-96">
          <p>Asset not found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 space-y-6 max-w-7xl mx-auto relative z-10">
      <div>
        <div className="flex items-center mb-4 text-xs select-none ">
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
              <span>Video Coming Soon...</span>
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
            {singleTranscodingJob.completeDuration && (
              <Info
                label="Transcoding Duration"
                value={`${Number.parseFloat(singleTranscodingJob.completeDuration).toFixed(2)}s`}
              />
            )}
          </div>
        </div>
      </div>

      <TabSection {...singleTranscodingJob} />
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 justify-between gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-medium text-left">{value}</span>
    </div>
  );
}
