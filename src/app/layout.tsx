import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { DataProvider } from "@/components/providers/DataProvider";

export const metadata: Metadata = {
  title: "RosterGen | Enterprise Workforce & On-Call Scheduler",
  description: "Deterministic workforce optimization and on-call rotation dispatch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <DataProvider>
          <Navbar />
          <div className="pl-0 md:pl-72 min-h-screen">
            <main className="pt-16 min-h-screen pb-20">
              {children}
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
