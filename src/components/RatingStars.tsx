"use client";

import { Star } from "lucide-react";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  value?: number;
  onChange?: (value: number) => void;
};

export default function RatingStars({ rating, size = "md", interactive, value, onChange }: Props) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  const display = interactive ? value || 0 : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? "cursor-pointer hover:scale-110 transition" : "cursor-default"}
        >
          <Star
            className={`${sizeClass} ${star <= display ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        </button>
      ))}
      {!interactive && rating > 0 && (
        <span className="text-sm text-[var(--muted)] ms-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
