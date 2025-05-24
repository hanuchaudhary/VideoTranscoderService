import type React from "react";
import PlusIcon from "./PlusIcon";

export function HowItWorks() {
  return (
    <section className="relative bg-secondary/30 border-b py-16 px-6 md:px-16">
      <div className="absolute -top-4 -left-4">
        <PlusIcon />
      </div>
      <div className="absolute -bottom-4 -right-4">
        <PlusIcon />
      </div>

      <div className="grid md:grid-cols-3 gap-12 items-center">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-3xl md:text-4xl font-semibold">
            <span>How it works?</span>{" "}
            <span className="text-muted-foreground">
              Simplify your video workflow.
            </span>
          </h2>
          <ol className="space-y-4 text-lg text-muted-foreground list-decimal list-inside">
            <li>
              <span className="text-blue-400 font-medium">Upload</span> your
              video file via our intuitive dashboard or API.
            </li>
            <li>
              <span className="text-purple-400 font-medium">Select</span>{" "}
              desired formats and resolutions (144p to 4K).
            </li>
            <li>
              <span className="text-green-400 font-medium">Download</span> or
              distribute your transcoded videos instantly.
            </li>
          </ol>
          <div className="flex flex-wrap gap-4">
            <button className="dark:bg-white bg-neutral-200 text-black md:px-6 px-4 md:py-3 py-1.5 md:text-base text-sm rounded-full font-medium hover:bg-neutral-200 transition cursor-pointer">
              Try It Now
            </button>
            <button className="bg-neutral-900 text-white md:px-6 md:py-3 px-4 py-1.5 md:text-base text-sm rounded-full border border-neutral-800 hover:bg-neutral-800 transition cursor-pointer">
              Watch Demo
            </button>
          </div>
        </div>
        {/* <div className="hidden md:block">
          <img
            src="/assets/how-it-works-infographic.png"
            alt="How it works infographic"
            className="w-full h-auto"
          />
        </div> */}
      </div>
    </section>
  );
}
