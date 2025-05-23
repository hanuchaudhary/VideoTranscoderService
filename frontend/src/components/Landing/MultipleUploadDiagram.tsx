"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

export function MultipleUploadDiagram({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);
  const div8Ref = useRef<HTMLDivElement>(null);
  const div9Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden select-none p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center">
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div1Ref}
          >
            4k
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h3
            ref={div2Ref}
            className="px-4 py-1 rounded-full font-semibold bg-secondary z-50"
          >
            Lumora
          </h3>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div3Ref}
          >
            144p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div4Ref}
          >
            240p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div5Ref}
          >
            360p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div6Ref}
          >
            480p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div7Ref}
          >
            7200p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div8Ref}
          >
            1080p
          </div>
          <div
            className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
            ref={div9Ref}
          >
            2160p
          </div>
        </div>
      </div>

      {/* AnimatedBeams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div8Ref}
        toRef={div2Ref}
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div2Ref}
        duration={2}
      />
    </div>
  );
}
