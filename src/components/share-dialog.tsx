"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PuzzleResponse } from "@/lib/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzle: PuzzleResponse;
  time: number;
}

export function ShareDialog({
  open,
  onOpenChange,
  puzzle,
  time,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const puzzleUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/puzzle/${puzzle.id}?t=${time}`
      : "";

  const shareText = `Crossy \u2014 ${puzzle.topic}\nI solved it in ${formatTime(time)}. Can you beat my time?\n${puzzleUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Only pass text (which includes the URL) — passing both text and url
        // causes iOS Messages to show the link twice
        await navigator.share({
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-crossy-cream border-crossy-ink/10">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-crossy-ink">
            Share your results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-md p-4 border border-crossy-ink/10 font-sans text-sm whitespace-pre-line text-crossy-ink/80 leading-relaxed">
            {shareText}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="border-crossy-ink/20 text-crossy-ink/70"
              >
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
