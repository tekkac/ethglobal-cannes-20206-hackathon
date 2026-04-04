import type { Metadata } from "next";
import { Bebas_Neue, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const arenaSans = Space_Grotesk({
  variable: "--font-arena-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const arenaDisplay = Bebas_Neue({
  variable: "--font-arena-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Duel Arena",
  description: "Website-first arena broadcast for human-backed agent duels."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${arenaSans.variable} ${arenaDisplay.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
