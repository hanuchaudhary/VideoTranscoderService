"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PlusIcon from "./PlusIcon";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const items = [
    {
      question: "What video formats does your service support?",
      answer:
        "We support a wide range of formats, including MP4, AVI, MOV, MKV, WMV, and more. You can transcode to popular codecs like H.264, H.265, and VP9 for compatibility across platforms.",
    },
    {
      question: "How long does it take to transcode a video?",
      answer:
        "Transcoding times vary based on file size and resolution, but our cloud-based infrastructure ensures most videos are processed in minutes. For example, a 10-minute 1080p video typically takes under 2 minutes.",
    },
    {
      question: "Is my video data secure during transcoding?",
      answer:
        "Yes, we use end-to-end encryption and secure cloud storage to protect your files. Your videos are automatically deleted from our servers after processing, ensuring privacy.",
    },
    {
      question: "Can I transcode videos to multiple resolutions at once?",
      answer:
        "Absolutely! You can select multiple output resolutions (144p to 4K) in a single job, making it easy to prepare videos for different platforms or devices.",
    },
    {
      question: "What happens if I exceed my plan’s transcoding limit?",
      answer:
        "For paid plans, you can purchase additional transcoding minutes as needed. Free plan users can upgrade to a paid plan for higher limits. You’ll be notified before reaching your limit.",
    },
    {
      question: "Can I cancel or change my subscription anytime?",
      answer:
        "Yes, you can cancel or switch plans at any time through your account dashboard. No long-term commitments are required, and changes take effect immediately.",
    },
    {
      question: "Do you offer refunds for unused subscriptions?",
      answer:
        "We provide a 7-day money-back guarantee for monthly plans and a 14-day guarantee for annual plans. Contact our support team for assistance.",
    },
    {
      question: "Can I integrate your service into my app or website?",
      answer:
        "Yes, our developer-friendly API allows seamless integration for automated video transcoding. Check our API documentation (#) for details.",
    },
    {
      question: "What kind of support do you offer?",
      answer:
        "Free plan users get email support, while paid plans include priority email and 24/7 chat support. Enterprise plans come with dedicated account managers.",
    },
    {
      question: "Do you offer a free trial or plan?",
      answer:
        "Yes, our Free Tier lets you transcode up to 10 minutes of video per month at no cost, with access to 720p resolution. Try it today to experience our service!",
    },
  ];

  return (
    <section className="relative border-b transition-transform">
      <div className="absolute -top-4 -left-4">
        <PlusIcon />
      </div>
      <div className="absolute -bottom-4 -right-4">
        <PlusIcon />
      </div>
      <div className="md:grid grid-cols-3">
        <h2 className="col-span-1 text-xl md:text-2xl px-7 py-10 font-bold text-center border-r">
          Frequently asked questions.
        </h2>
        <div className="w-full col-span-2">
          {items.map((item, index) => (
            <div
              onClick={() => toggleItem(index)}
              key={index}
              className={`w-full md:p-7 p-5 cursor-pointer ${
                index !== items.length - 1 ? "border-b" : ""
              } overflow-hidden`}
            >
              <div className="flex items-center ">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp
                      className="w-5 h-5 cursor-pointer"
                      onClick={() => toggleItem(index)}
                    />
                  ) : (
                    <ChevronDown
                      className="w-5 h-5 cursor-pointer"
                      onClick={() => toggleItem(index)}
                    />
                  )}
                </div>
              </div>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="mt-5 text-muted-foreground">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
