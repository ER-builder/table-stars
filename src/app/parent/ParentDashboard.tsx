"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child, Star, Prize } from "@/lib/types";
import ChildCard from "@/components/ChildCard";
import { fireConfetti, fireStarConfetti } from "@/components/Confetti";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

interface ParentDashboardProps {
  children: Child[];
  stars: Star[];
  prizes: Prize[];
}

export default function ParentDashboard({
  children,
  stars,
  prizes,
}: ParentDashboardProps) {
  const router = useRouter();
  const today = getToday();

  // 28-day grid (4 weeks), oldest→newest
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split("T")[0];
  });

  async function toggleStar(childId: string, date: string) {
    const res = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date }),
    });
    const data = await res.json();
    if (data.action === "added") {
      fireStarConfetti();
      if (data.autoPrize) fireConfetti();
    }
    router.refresh();
  }

  return (
    <>
      {children.map((child) => {
        const childStars = stars.filter((s) => s.child_id === child.id);
        const childPrizes = prizes.filter((p) => p.child_id === child.id);
        const todayStar = childStars.find((s) => s.date === today) ?? null;

        return (
          <div key={child.id} className="w-full space-y-3">
            <ChildCard
              child={child}
              stars={childStars}
              prizes={childPrizes}
              isParent
              todayStar={todayStar}
              onToggleStar={() => toggleStar(child.id, today)}
            />

            {/* 28-day interactive history grid */}
            <div className="bg-white/60 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-gray-500 mb-3">
                History (tap to edit)
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-400 pb-1">
                    {d}
                  </div>
                ))}
                {last28Days.map((date) => {
                  const hasStar = childStars.some((s) => s.date === date);
                  const isFuture = date > today;
                  const isToday = date === today;
                  return (
                    <button
                      key={date}
                      disabled={isFuture}
                      onClick={() => toggleStar(child.id, date)}
                      title={date}
                      className={`flex items-center justify-center rounded-lg h-9 text-base transition-all active:scale-90
                        ${isFuture ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-purple-50"}
                        ${isToday ? "ring-2 ring-purple-400" : ""}
                        ${hasStar ? "bg-amber-100" : "bg-gray-50"}
                      `}
                    >
                      {hasStar ? "⭐" : "·"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
