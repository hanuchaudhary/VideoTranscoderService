import React from "react";
import AnimatedGradientBackground from "../ui/animated-gradient-background";
import Link from "next/link";
import { WordRotate } from "../ui/WordRotate";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden flex items-center justify-center border-b h-[calc(100vh-10rem)]">
      <div className="flex-1 max-w-3xl z-10 relative">
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-center leading-none">
          Transcode Videos{" "}
          <span className="flex items-center justify-center">
            <WordRotate words={["Lighting", "Blazing", "Rapid", "Instant"]} />
            -Fast with
          </span>{" "}
          Voxer
        </h1>
        <p className="md:text-lg text-sm max-w-xs md:max-w-full text-muted-foreground my-8 text-center">
          Convert videos from 144p to 4K in seconds—perfect for creators,
          businesses, and developers.
        </p>
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <Link href="/dashboard">
            <button className="border px-7 py-3 rounded-full transition-colors font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer border-primary">
              Start Transcoding Now
            </button>
          </Link>
          <button className="border px-7 py-3 rounded-full transition-colors font-semibold dark:hover:bg-secondary cursor-pointer bg-secondary dark:bg-transparent">
            Try for Free
          </button>
        </div>
      </div>
      <AnimatedGradientBackground />
    </section>
  );
}
