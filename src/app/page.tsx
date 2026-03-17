import { PuzzleForm } from "@/components/puzzle-form";
import { RecentPuzzles } from "@/components/recent-puzzles";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Crossy",
  url: "https://crossygame.app",
  description:
    "Generate and play mini crosswords on any topic. Pick a topic, solve the puzzle, challenge your friends.",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 paper-texture">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="flex flex-col items-center gap-2 mb-10 mt-8">
        <h1 className="font-serif text-5xl sm:text-6xl tracking-tight text-crossy-ink">
          Crossy
        </h1>
        <p className="font-sans text-crossy-ink/50 text-center text-sm sm:text-base max-w-xs">
          Mini crosswords on any topic. Generate, play, share.
        </p>
        <div className="w-12 h-0.5 bg-crossy-gold/40 mt-2" />
      </div>

      {/* Form */}
      <PuzzleForm />

      {/* Browse existing puzzles */}
      <RecentPuzzles />

      {/* Footer */}
      <footer className="mt-16 text-center">
        <p className="font-sans text-xs text-crossy-ink/25">
          Each puzzle is uniquely generated
        </p>
      </footer>
    </main>
  );
}
