"use client";

import { useState, useEffect } from "react";
import type { Child, Star, Prize } from "@/lib/types";

interface ChildCardProps {
  child: Child;
  stars: Star[];
  prizes: Prize[];
  isParent?: boolean;
  todayStar?: Star | null;
  onToggleStar?: () => void;
}

export default function ChildCard({
  child,
  stars,
  prizes,
  isParent = false,
  todayStar,
  onToggleStar,
}: ChildCardProps) {
  const [animateStar, setAnimateStar] = useState<number | null>(null);
  const totalStars = stars.length;
  const totalPrizes = prizes.length;
  const redeemedStars = prizes.reduce((sum, p) => sum + p.stars_redeemed, 0);
  const unredeemedStars = totalStars - redeemedStars;
  const currentProgress = unredeemedStars % 10;
  const canRedeem = unredeemedStars >= 10;
  const starsToNext = 10 - currentProgress;

  useEffect(() => {
    if (animateStar !== null) {
      const timer = setTimeout(() => setAnimateStar(null), 600);
      return () => clearTimeout(timer);
    }
  }, [animateStar]);

  const starSlots = Array.from({ length: 10 }, (_, i) => i < currentProgress);

  return (
    <div className="rounded-3xl p-6 shadow-lg bg-white/80 backdrop-blur-sm border-2 border-warm-200">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-5xl">{child.avatar_emoji}</span>
        <div>
          <h2 className="text-2xl font-bold text-purple-600">{child.name}</h2>
          <p className="text-sm text-gray-500">
            {totalStars} star{totalStars !== 1 ? "s" : ""} total · {totalPrizes} prize
            {totalPrizes !== 1 ? "s" : ""} 🎁
          </p>
        </div>
      </div>

      {/* Star grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {starSlots.map((filled, i) => (
          <div
            key={i}
            className={`flex items-center justify-center text-3xl rounded-xl h-14 transition-all duration-300
              ${filled ? "bg-warm-100 star-sparkle" : "bg-gray-100"}
              ${animateStar === i ? "star-bounce" : ""}
            `}
          >
            {filled ? "⭐" : "☆"}
          </div>
        ))}
      </div>

      {/* Progress text */}
      <div className="text-center mb-4">
        {canRedeem ? (
          <p className="text-lg font-bold text-orange-500 animate-pulse">
            🎉 Prize ready! {unredeemedStars} stars earned!
          </p>
        ) : (
          <p className="text-gray-600">
            {starsToNext === 10 && currentProgress === 0
              ? "Start earning stars! ✨"
              : `${starsToNext} more star${starsToNext !== 1 ? "s" : ""} to next prize! 🏆`}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warm-400 to-orange-400 transition-all duration-700 ease-out"
          style={{ width: `${(currentProgress / 10) * 100}%` }}
        />
      </div>

      {/* Parent actions */}
      {isParent && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!todayStar) setAnimateStar(currentProgress);
              onToggleStar?.();
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
              todayStar
                ? "bg-red-100 text-red-600 border-2 border-red-200"
                : "bg-warm-400 text-white shadow-md hover:bg-warm-500"
            }`}
          >
            {todayStar ? "Remove ✕" : "Give Star ⭐"}
          </button>
        </div>
      )}
    </div>
  );
}
