import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AppNav } from "@/src/presentation/components/AppNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Player Points Explorer",
  description:
    "Week-by-week Yahoo fantasy points for every MLB player, this season and every past one.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white`}>
        <AppNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
