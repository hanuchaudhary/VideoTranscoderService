"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import ShinyText from "../ui/ShinyText";
import { Logo } from "../Logo";

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
        "relative flex w-full items-center justify-center overflow-hidden select-none md:p-10",
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
            className="z-50"
          >
            <Logo/>
          </h3>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {[
            {
              id: 1,
              name: "144p",
              ref: div3Ref,
            },
            {
              id: 2,
              name: "240p",
              ref: div4Ref,
            },
            {
              id: 3,
              name: "360p",
              ref: div5Ref,
            },
            {
              id: 4,
              name: "480p",
              ref: div6Ref,
            },
            {
              id: 5,
              name: "720p",
              ref: div7Ref,
            },
            {
              id: 6,
              name: "1080p",
              ref: div8Ref,
            },
            {
              id: 7,
              name: "2160p",
              ref: div9Ref,
            },
          ].map((item) => (
            <div
              key={item.id}
              className="dark:bg-neutral-950 bg-secondary/30 backdrop-blur-sm border text-sm font-semibold text-center rounded-sm  px-5 z-50 py-1"
              ref={item.ref}
            >
              <ShinyText text={item.name} disabled={false} speed={3} />
            </div>
          ))}
        </div>
      </div>

      {/* AnimatedBeams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div8Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div2Ref}
        duration={3}
      />
    </div>
  );
}
