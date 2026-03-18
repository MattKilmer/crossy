import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Crossy — Mini Crosswords on Any Topic",
    template: "%s | Crossy",
  },
  description:
    "Generate and play mini crosswords about anything — from Jazz to Space to Cooking. Pick a topic, solve the puzzle, and challenge your friends to beat your time.",
  metadataBase: new URL("https://crossygame.app"),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "crossword",
    "mini crossword",
    "crossword puzzle",
    "word game",
    "puzzle game",
    "daily crossword",
    "crossword generator",
    "topic crossword",
  ],
  authors: [{ name: "Crossy", url: "https://crossygame.app" }],
  creator: "Crossy",
  manifest: "/manifest.json",
  openGraph: {
    title: "Crossy — Mini Crosswords on Any Topic",
    description:
      "Pick any topic. Get a crossword. Challenge your friends. Jazz, Space, Cooking, Sports — you name it.",
    type: "website",
    siteName: "Crossy",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crossy — Mini Crosswords on Any Topic",
    description:
      "Pick any topic. Get a crossword. Challenge your friends.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
        <Analytics />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
