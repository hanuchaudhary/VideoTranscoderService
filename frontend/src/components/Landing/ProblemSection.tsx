import React from "react";
import Pill from "../Pill";

export function ProblemSection() {
  return (
    <section className="h-[calc(100vh-10rem) border-b">
      <div className="md:py-20 py-14 col-span-1 px-5 border-b">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Struggling to Create Viral Content?
        </h2>
      </div>
      <div className="">
        <div className="md:p-8 p-4 border-b text-left">
          <p className="text-muted-foreground md:text-xl md:block flex flex-col text-base font-semibold gap-1">
            <Pill
              classname="dark:text-blue-400 text-blue-800 bg-blue-500/30"
              text="Content Creators"
            />{" "}
            Optimize your videos for YouTube, Vimeo, or social media with
            perfect resolution and file size.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="md:p-8 p-4 text-left border-r">
            <p className="text-muted-foreground md:text-xl md:block flex flex-col text-base font-semibold gap-1">
              <span className="dark:text-white text-black">
                <Pill
                  classname="dark:text-purple-400 text-purple-800 bg-purple-500/30"
                  text="Businesses"
                />{" "}
              </span>
              Deliver professional-grade videos to your audience across devices.
            </p>
          </div>
          <div className="md:p-8 p-4 text-left">
            <p className="text-muted-foreground md:text-xl md:block flex flex-col text-base font-semibold gap-1">
              <span className="dark:text-white text-black">
                <Pill
                  classname="dark:text-green-400 text-green-800 bg-green-500/30"
                  text="Developers"
                />{" "}
              </span>
              Automate video workflows with our robust API and scalable
              infrastructure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
