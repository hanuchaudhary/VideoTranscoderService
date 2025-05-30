import React from "react";
import { CpuArchitecture } from "../ui/cpu-architecture";
import { MultipleUploadDiagram } from "./MultipleUploadDiagram";
import {
  IconCpu,
  IconCube,
  IconDevices,
  IconPlayerPlayFilled,
  IconWorldUpload,
} from "@tabler/icons-react";
import ShinyText from "../ui/ShinyText";

export function FeaturesSection() {
  return (
    <section className="min-h-[calc(100vh-10rem)] border-b">
      <div className="w-full border-b">
        <div className="md:py-24 py-14 px-4 max-w-xl mx-auto">
          <h2 className="text-xl md:text-3xl font-bold text-center mb-4">
            Everything You Need for Seamless{" "}
            <span className="text-muted-foreground">Video Transcoding</span>
          </h2>
        </div>
      </div>
      <div className="">
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-8 gap-4 h-full border-b">
          <div className="md:border-r border-b h-full md:p-10 p-5">
            <p className="flex items-center gap-2 text-muted-foreground">
              <IconWorldUpload className="w-5 h-5" />
              <span className=" ">Multiple Format Support</span>
            </p>
            <p className="font-semibold md:text-2xl text-xl mt-4">
              Convert videos to 144p, 240p, 360p, 480p, 720p, 1080p, 2K, and 4K
              resolutions.
            </p>
            <div className="md:mt-0 mt-7">
              <MultipleUploadDiagram />
            </div>
          </div>
          <div className="h-full md:p-10 p-6 flex flex-col justify-between">
            <div>
              <p className="flex items-center gap-2 text-muted-foreground">
                <IconCpu className="w-5 h-5" />
                <span className="">Fast & Scalable</span>
              </p>
              <p className="font-semibold md:text-2xl text-xl mt-4">
                Process videos in minutes with our cloud-based, high-speed
                pipeline.
              </p>
            </div>
            <div className="md:p-6">
              <CpuArchitecture />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-8 gap-4 h-full">
          <div className="md:border-r h-full md:p-10 p-5 flex flex-col justify-between">
            <div>
              <p className="flex items-center gap-2 text-muted-foreground">
                <IconCube />
                <span className=" ">High Quality</span>
              </p>
              <p className="font-semibold md:text-2xl text-xl mt-4">
                Preserve video quality with advanced encoding algorithms.
              </p>
            </div>
            <div className="flex font-semibold gap-2">
              <div className="border-2 bg-secondary/30 p-3">Video</div>
              <div className="border-2 bg-secondary/30 p-3">Storage</div>
              <div className="border-2 bg-secondary/30 p-3">Transcoding</div>
              <div className="border-2 bg-secondary/30 p-3">Streaming</div>
            </div>
          </div>
          <div className="h-full md:p-10 p-5">
            <p className="flex items-center gap-2 text-muted-foreground">
              <IconDevices className="w-5 h-5" />
              <span className="">Cross-Platform Compatibility</span>
            </p>
            <p className="font-semibold md:text-2xl text-xl mt-4">
              Works with MP4, AVI, MOV, and more.
            </p>
            <div className="pb-6 pt-14 w-full flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary/30 text-primary">
                <IconPlayerPlayFilled className="h-10 w-10 animate-in" />
              </div>
              <ShinyText
                text='"Effortlessly transcode your videos with unmatched speed and quality!"'
                disabled={false}
                speed={3}
                className="italic text-sm text-muted-foreground mt-4"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
