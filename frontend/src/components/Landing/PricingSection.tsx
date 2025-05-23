import { Check } from "lucide-react";
import React from "react";

interface Plan {
  title: string;
  price: string;
  description: string;
  credits: string;
  features: string[];
  buttonText: string;
  buttonVariant: "outline" | "primary";
}

export function PricingSection() {
  const pricingPlans: Plan[] = [
    {
      title: "Free",
      price: "$0/month",
      description: "Perfect for hobbyists and testing the service.",
      credits: "10 minutes/month",
      features: [
        "Up to 720p resolution",
        "Basic codecs (H.264)",
        "Watermarked outputs",
        "Email support (48-hour response)",
        "1 concurrent transcode",
        "No API access",
        "No priority processing",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      title: "Basic",
      price: "$9.99/month",
      description: "Ideal for small creators and startups.",
      credits: "100 minutes/month",
      features: [
        "Up to 1080p resolution",
        "All codecs (H.264, H.265, VP9)",
        "No watermarks",
        "Email support (24-hour response)",
        "2 concurrent transcodes",
        "Basic API access (100 API calls/month)",
        "Standard processing speed",
        "Add-on: $0.10 per additional minute",
      ],
      buttonText: "Choose Basic",
      buttonVariant: "primary",
    },
    {
      title: "Pro",
      price: "$29.99/month",
      description: "Best for professional creators and businesses.",
      credits: "500 minutes/month",
      features: [
        "Up to 4K resolution",
        "All codecs + advanced settings (e.g., custom bitrate)",
        "No watermarks",
        "Priority email + 24/7 chat support",
        "5 concurrent transcodes",
        "Full API access (1,000 API calls/month)",
        "Priority processing for faster results",
        "Add-on: $0.05 per additional minute",
      ],
      buttonText: "Choose Pro",
      buttonVariant: "primary",
    },
    // {
    //   title: "Enterprise",
    //   price: "Custom Pricing",
    //   description: "Tailored for high-volume users and large organizations.",
    //   credits: "Unlimited minutes",
    //   features: [
    //     "Up to 4K resolution + custom outputs",
    //     "All codecs + bespoke encoding options",
    //     "No watermarks",
    //     "Dedicated account manager + 24/7 priority support",
    //     "Unlimited concurrent transcodes",
    //     "Advanced API access (unlimited calls)",
    //     "Guaranteed SLA (99.9% uptime)",
    //     "Custom integrations and analytics",
    //   ],
    //   buttonText: "Contact Us",
    //   buttonVariant: "outline",
    // },
  ];

  return (
    <section className="border-b">
      <div className="border-b">
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

      <div className="grid md:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              index === pricingPlans.length - 1 ? "" : "border-r"
            } py-14 px-6`}
          >
            <div>
              <h3 className="text-xl font-bold">{plan.title}</h3>
              <p className="text-muted-foreground mt-2 mb-1">
                {plan.description}
              </p>
              <p className="text-primary font-semibold mb-6">
                {plan.price} – {plan.credits}
              </p>
            </div>
            <div>
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center mb-2">
                  <Check className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
