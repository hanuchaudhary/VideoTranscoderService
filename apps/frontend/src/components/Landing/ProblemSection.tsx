import Pill from "../Pill"

export function ProblemSection() {
  return (
    <section className="border-b bg-secondary/30">
      <div className="md:py-20 py-14 col-span-1 px-5 border-b">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Struggling with Video Transcoding Challenges?</h2>
      </div>
      <div className="border-b md:text-left text-center md:flex ">
        <div className="group flex-shrink-0 flex items-center justify-center hover:bg-secondary/40">
          <div className="flex items-center justify-center h-full p-4">
            <button className="dark:text-blue-400 px-4 py-2 rounded-3xl font-semibold leading-none text-blue-800 bg-blue-500/30 ">
              Content creators
            </button>
          </div>
        </div>
        <p className="border-l md:p-8 p-4 text-muted-foreground md:text-lg md:block flex flex-col text-base font-semibold gap-1 hover:bg-secondary/40">
          Slow transcoding and format issues slowing down your YouTube or social media uploads? Our service delivers
          lightning-fast conversions to 144p–4K with perfect file sizes.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="md:p-8 p-4 text-left border-r hover:bg-secondary/40">
          <p className="text-muted-foreground md:text-lg md:block flex flex-col text-base font-semibold gap-1">
            <span className="dark:text-white text-black">
              <Pill classname="dark:text-purple-400 text-purple-800 bg-purple-500/30" text="Businesses" />{" "}
            </span>
            Need high-quality videos across devices without the hassle? Transcode effortlessly to any format, ensuring
            professional-grade delivery for your audience.
          </p>
        </div>
        <div className="md:p-8 p-4 text-left hover:bg-secondary/40">
          <p className="text-muted-foreground md:text-lg md:block flex flex-col text-base font-semibold gap-1">
            <span className="dark:text-white text-black">
              <Pill classname="dark:text-green-400 text-green-800 bg-green-500/30" text="Developers" />{" "}
            </span>
            Tired of complex video workflows? Automate transcoding with our robust API and scalable cloud
            infrastructure, from 144p to 4K.
          </p>
        </div>
      </div>
    </section>
  )
}
