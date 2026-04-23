"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Child, Star, Prize } from "@/lib/types";
import ChildCard from "@/components/ChildCard";
import { fireConfetti, fireStarConfetti } from "@/components/Confetti";

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  const [localStars, setLocalStars] = useState<Star[]>(stars);
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);

  useEffect(() => setLocalStars(stars), [stars]);
  useEffect(() => setLocalPrizes(prizes), [prizes]);

  function fmt(y: number, m: number, day: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const now = new Date();
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(
    "en",
    { month: "long", year: "numeric" },
  );
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const isCurrentMonth =
    viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth();

  function shiftMonth(delta: number) {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  async function toggleStar(childId: string, date: string) {
    const existing = localStars.find(
      (s) => s.child_id === childId && s.date === date,
    );
    const willAdd = !existing;

    // Optimistic update
    if (willAdd) {
      const optimistic: Star = {
        id: `optimistic-${childId}-${date}`,
        child_id: childId,
        date,
        awarded_by: "",
        created_at: new Date().toISOString(),
      } as Star;
      setLocalStars((prev) => [...prev, optimistic]);
    } else {
      setLocalStars((prev) => prev.filter((s) => s.id !== existing!.id));
    }

    const res = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date }),
    });
    const data = await res.json();
    if (data.action === "added") {
      fireStarConfetti();
      if (data.autoPrize) {
        fireConfetti();
        setLocalPrizes((prev) => [
          ...prev,
          {
            id: `optimistic-prize-${childId}-${Date.now()}`,
            child_id: childId,
            stars_redeemed: 10,
            redeemed_at: new Date().toISOString(),
          } as Prize,
        ]);
      }
    }
    router.refresh();
  }

  return (
    <>
      {children.map((child) => {
        const childStars = localStars.filter((s) => s.child_id === child.id);
        const childPrizes = localPrizes.filter((p) => p.child_id === child.id);
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

            {/* Monthly history grid */}
            <div className="bg-white/60 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="px-3 py-1 rounded-lg text-purple-500 hover:bg-purple-50 active:scale-90"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <h3 className="text-sm font-bold text-gray-600">{monthLabel}</h3>
                <button
                  onClick={() => shiftMonth(1)}
                  disabled={isCurrentMonth}
                  className={`px-3 py-1 rounded-lg active:scale-90 ${
                    isCurrentMonth
                      ? "text-gray-300 cursor-default"
                      : "text-purple-500 hover:bg-purple-50"
                  }`}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-400 pb-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-12" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const date = fmt(viewMonth.year, viewMonth.month, dayNum);
                  const hasStar = childStars.some((s) => s.date === date);
                  const isFuture = date > today;
                  const isToday = date === today;
                  return (
                    <button
                      key={date}
                      disabled={isFuture}
                      onClick={() => toggleStar(child.id, date)}
                      title={date}
                      className={`relative flex flex-col items-center justify-center rounded-lg h-12 transition-all active:scale-90
                        ${isFuture ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-purple-50"}
                        ${isToday ? "ring-2 ring-purple-400" : ""}
                        ${hasStar ? "bg-amber-100 ring-1 ring-amber-300" : "bg-gray-50"}
                      `}
                    >
                      <span
                        className={`absolute top-0.5 right-1 text-[10px] leading-none ${
                          hasStar ? "text-amber-700 font-semibold" : "text-gray-400"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <span className="text-lg leading-none">
                        {hasStar ? "⭐" : ""}
                      </span>
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
