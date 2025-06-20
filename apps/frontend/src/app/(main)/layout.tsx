import { DashboardNavbar } from "@/components/Dashboard/DashboardNavbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voxer | Dashboard",
  description: "Dashboard for Voxer",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`dark:bg-black bg-white min-h-screen relative overflow-hidden`}
    >
      <DashboardNavbar />
      <div className="">{children}</div>
    </div>
  );
}
