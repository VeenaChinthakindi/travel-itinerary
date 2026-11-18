import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wayfarer — AI Travel Itinerary Planner",
  description: "Plan a day-by-day trip itinerary in seconds, powered by Groq.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
