"use client";

import { Check } from "lucide-react";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SubscriptionDialog } from "../SubscriptionButton";

interface Plan {
  title: string;
  price: string;
  description: string;
  credits: string;
  features: string[];
  buttonText: string;
}

export function PricingSection() {
  const router = useRouter();
  const pathname = usePathname();

  const pricingPlans: Plan[] = [
    {
      title: "Free",
      price: "$0/month",
      description: "Kick off your video project. No credit card required.",
      credits: "100K delivery minutes/month",
      features: [
        "720p resolution",
        "H.264 codec support",
        "No live streaming",
        "Email support (48-hour response)",
        "No API access",
        "Up to 10 uploaded videos",
      ],
      buttonText: "Start for Free",
    },
    {
      title: "Starter",
      price: "$10/month",
      description: "Scales with your app or site as it grows.",
      credits: "$100 usage credit/month",
      features: [
        "Up to 1080p resolution",
        "All major codecs (H.264, H.265)",
        "Live and on-demand streaming",
        "Email support (24-hour response)",
        "Basic API access",
        "Unlimited video uploads",
        "Add-on: $0.05 per additional 1000 minutes",
      ],
      buttonText: "Start Building",
    },
    {
      title: "Enterprise",
      price: "Custom Pricing",
      description: "More security, support, and scale for larger teams.",
      credits: "Custom usage credits",
      features: [
        "Up to 4K resolution + custom renditions",
        "All codecs with advanced settings",
        "No watermarks",
        "Live + VOD with SLA uptime guarantee",
        "Dedicated support + 24/7 access",
        "Advanced API (unlimited calls)",
        "Custom integrations + analytics",
        "Steep usage discounts above $3K/month",
      ],
      buttonText: "Talk to Us",
    },
  ];

  return (
    <section className="border-b relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

      <div className="border-b relative z-10">
        <div className="md:h-20 h-14 grid grid-cols-10 w-full">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`border-b ${i < 9 ? "border-r" : ""}`}
            ></div>
          ))}
        </div>
        <div className="py-10">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-2">
            Flexible Credit-Based Plans
          </h2>
          <p className="text-muted-foreground md:text-lg text-center max-w-2xl mx-auto">
            Purchase a plan that fits your production volume. Use credits for
            rendering, AI editing, and more.
          </p>
        </div>
        <div className="md:h-20 h-14 grid grid-cols-10 w-full">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`border-t ${i < 9 ? "border-r" : ""}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 relative z-10">
        {pricingPlans.map((plan, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              index === pricingPlans.length - 1 ? "" : "border-r"
            } pt-14 ${index === 1 ? "bg-secondary/30" : ""}`}
          >
            <div className="mb-8 px-6">
              <h3 className="text-2xl font-semibold">{plan.title}</h3>
              <p className="text-muted-foreground mt-2 mb-1">
                {plan.description}
              </p>
              <p className="text-primary font-semibold">
                {plan.price} – {plan.credits}
              </p>
            </div>
            <div className="mb-4 px-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex text-sm items-center mb-2">
                  <Check className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
            {pathname === "/pricing" ? (
              <SubscriptionDialog index={index} planText={plan.buttonText} />
            ) : (
              <Link
                href="/pricing"
                className={`mt-auto py-5 border-t w-full font-semibold gap-4 flex items-center cursor-pointer justify-center leading-none ${index === 1 ? "bg-blue-600 hover:bg-blue-500 text-white" : "hover:bg-secondary/30"}`}
              >
                <span>{plan.buttonText}</span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
