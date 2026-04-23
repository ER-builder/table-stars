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

  // 4-week grid aligned to weekdays (Sun-Sat), ending on the week that contains today.
  // Compute date strings in LOCAL time so "today" matches the user's calendar day.
  function fmt(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const todayDate = new Date();
  const endOfWeek = new Date(todayDate);
  endOfWeek.setDate(todayDate.getDate() + (6 - todayDate.getDay())); // Saturday of current week
  const gridDays: string[] = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(endOfWeek);
    d.setDate(endOfWeek.getDate() - (27 - i));
    return fmt(d);
  });

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
                {gridDays.map((date) => {
                  const hasStar = childStars.some((s) => s.date === date);
                  const isFuture = date > today;
                  const isToday = date === today;
                  const dayNum = parseInt(date.slice(8, 10), 10);
                  return (
                    <button
                      key={date}
                      disabled={isFuture}
                      onClick={() => toggleStar(child.id, date)}
                      title={date}
                      className={`relative flex flex-col items-center justify-center rounded-lg h-11 transition-all active:scale-90
                        ${isFuture ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-purple-50"}
                        ${isToday ? "ring-2 ring-purple-400" : ""}
                        ${hasStar ? "bg-amber-100" : "bg-gray-50"}
                      `}
                    >
                      <span className={`text-[10px] leading-none ${hasStar ? "text-amber-700" : "text-gray-400"}`}>
                        {dayNum}
                      </span>
                      <span className="text-base leading-none mt-0.5">
                        {hasStar ? "⭐" : "·"}
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
