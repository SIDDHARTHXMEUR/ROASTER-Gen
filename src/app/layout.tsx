import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { DataProvider } from "@/components/providers/DataProvider";
import AppContainer from "@/components/layout/AppContainer";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={`h-full antialiased ${outfit.variable}`}>
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <DataProvider>
          <Navbar />
          <AppContainer>
            {children}
          </AppContainer>
        </DataProvider>
      </body>
    </html>
  );
}
