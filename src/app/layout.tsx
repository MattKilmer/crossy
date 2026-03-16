import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Sans } from "next/font/google";
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
  title: "Crossy — Mini Crosswords on Any Topic",
  description:
    "Generate and play mini crosswords about anything. Pick a topic, solve the puzzle, challenge your friends.",
  metadataBase: new URL("https://crossygame.app"),
  openGraph: {
    title: "Crossy — Mini Crosswords on Any Topic",
    description:
      "Pick any topic. Get a crossword. Challenge your friends. Jazz, Space, Cooking, Sports — you name it.",
    type: "website",
    siteName: "Crossy",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Crossy — Mini crosswords on any topic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crossy — Mini Crosswords on Any Topic",
    description:
      "Pick any topic. Get a crossword. Challenge your friends.",
    images: ["/opengraph-image"],
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
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
