"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, ALLOWED_EMAILS } from "@/lib/supabase";
import type { Child, Star, Prize } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import ChildCard from "@/components/ChildCard";
import { fireConfetti, fireStarConfetti } from "@/components/Confetti";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function ParentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u || !ALLOWED_EMAILS.includes(u.email ?? "")) {
        setAuthChecked(true);
        return;
      }
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  const loadData = useCallback(async () => {
    const [childRes, starRes, prizeRes] = await Promise.all([
      supabase.from("children").select("*").order("created_at"),
      supabase.from("stars").select("*").order("date", { ascending: false }),
      supabase.from("prizes").select("*").order("redeemed_at", { ascending: false }),
    ]);
    const newChildren = childRes.data ?? [];
    const newStars = starRes.data ?? [];
    const newPrizes = prizeRes.data ?? [];
    setChildren(newChildren);
    setStars(newStars);
    setPrizes(newPrizes);
    setLoading(false);
    return { stars: newStars, prizes: newPrizes };
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/parent`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function toggleStar(childId: string, date: string) {
    const existing = stars.find(
      (s) => s.child_id === childId && s.date === date
    );
    if (existing) {
      await supabase.from("stars").delete().eq("id", existing.id);
      await loadData();
    } else {
      await supabase.from("stars").insert({
        child_id: childId,
        date,
        awarded_by: user!.email,
      });
      fireStarConfetti();
      const { stars: newStars, prizes: newPrizes } = await loadData();
      // Auto-prize: if unredeemed stars hit 10, award automatically
      const childStars = newStars.filter((s) => s.child_id === childId);
      const childPrizes = newPrizes.filter((p) => p.child_id === childId);
      const redeemed = childPrizes.reduce((sum, p) => sum + p.stars_redeemed, 0);
      if (childStars.length - redeemed >= 10) {
        await supabase.from("prizes").insert({ child_id: childId, stars_redeemed: 10 });
        fireConfetti();
        await loadData();
      }
    }
  }

  if (!authChecked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-bounce">⭐</div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        <h1 className="text-3xl font-extrabold text-purple-600">
          Parent Login
        </h1>
        <p className="text-gray-500 text-center">
          Sign in to manage your children&apos;s stars
        </p>
        <button
          onClick={signIn}
          className="py-4 px-8 rounded-2xl font-bold text-lg bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-all active:scale-95"
        >
          Sign in with Google
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-purple-400 hover:text-purple-600"
        >
          ← Back to stars
        </button>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl animate-bounce">⭐</div>
      </div>
    );
  }

  const today = getToday();

  // 28-day grid (4 weeks), oldest→newest
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split("T")[0];
  });

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-extrabold text-purple-600">
          Parent Dashboard
        </h1>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Sign out
        </button>
      </div>

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

      <button
        onClick={() => router.push("/")}
        className="text-sm text-purple-400 hover:text-purple-600 mt-4"
      >
        ← Kids view
      </button>
    </main>
  );
}
