import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import React from "react";
import { ThemeSwitcher } from "../ThemeToggle";

const socialLinks = [
  { href: "https://facebook.com/videotranscode", icon: Facebook },
  { href: "https://twitter.com/videotranscode", icon: Twitter },
  { href: "https://instagram.com/videotranscode", icon: Instagram },
  { href: "https://youtube.com/@videotranscode", icon: Youtube },
];

const footerSections = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Features",
    links: [
      { href: "/features#multi-format", label: "Multi-Format Transcoding" },
      { href: "/features#api", label: "API Integration" },
      { href: "/features#real-time", label: "Real-Time Status" },
      { href: "/features#4k", label: "144p–4K Support" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Help Center" },
      { href: "/contact", label: "Contact Support" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="py-12 mt-10 max-w-5xl mx-auto">
      <div className="text-muted-foreground">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-xl font-semibold">Voxer</span>
            </div>
            <p className="mb-4">
              Lightning-fast video transcoding from 144p to 4K for creators,
              businesses, and developers.
            </p>
            <div className="flex space-x-4 text-muted-foreground">
              {socialLinks.map(({ href, icon: Icon }, index) => (
                <a
                  key={index}
                  href={href}
                  className="hover:text-primary transition"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-primary font-bold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="hover:text-primary transition"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="inline-block mt-4">
          <ThemeSwitcher />
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} . All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
