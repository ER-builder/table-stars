"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FFC107", "#F97316", "#A855F7", "#EC4899", "#34D399"],
  });
}

export function fireStarConfetti() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    shapes: ["star"],
    colors: ["#FFC107", "#FBBF24", "#FDE68A"],
  });
}

export default function ConfettiTrigger({ trigger }: { trigger: number }) {
  useEffect(() => {
    if (trigger > 0) {
      fireConfetti();
    }
  }, [trigger]);

  return null;
}
