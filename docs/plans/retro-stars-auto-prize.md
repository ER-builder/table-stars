# table-stars Feature Plan: Retro Stars + Auto Prize

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** (1) Parents can add/remove stars for any past date. (2) Prize auto-triggers when unredeemed stars hit 10 — no button needed. (3) Kids and parents can see full history past 7 days.

**Architecture:** All changes are client-side in 2 files. `parent/page.tsx` gains a date-aware toggleStar, an interactive 28-day history grid, and auto-prize logic. `ChildCard.tsx` drops the manual "Award Prize" button. Kids view (`page.tsx`) gets a prize history section.

**Tech Stack:** Next.js 16, React 19, Supabase JS SDK, Tailwind CSS 4. No new dependencies.

**Repo:** `ER-builder/table-stars` — work in `/tmp/table-stars` (already cloned + vercel linked). Push to `main` → Vercel auto-deploys.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/parent/page.tsx` | toggleStar(childId, date), auto-prize, 28-day interactive history grid |
| `src/components/ChildCard.tsx` | Remove onRedeemPrize prop + Award Prize button |
| `src/app/page.tsx` | Add prize history section to kids view |

---

## Task 1: Make `loadData` return fresh data (needed for auto-prize)

**File:** `src/app/parent/page.tsx`

Current `loadData` only sets state. After `await loadData()`, React state isn't yet updated synchronously, so we can't read `stars`/`prizes` immediately. Fix: return the fresh data.

- [ ] In `parent/page.tsx`, change `loadData` to return the fetched arrays:

```typescript
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
```

- [ ] Commit: `git add src/app/parent/page.tsx && git commit -m "refactor: loadData returns fresh data for auto-prize"`

---

## Task 2: Auto-prize when 10 unredeemed stars are reached

**File:** `src/app/parent/page.tsx`

Replace current `toggleStar` (today-only, no auto-prize) and `redeemPrize`. After adding a star, use the freshly-returned data to check if unredeemed >= 10 and auto-insert a prize + fire confetti.

- [ ] Replace `toggleStar` and `redeemPrize` functions:

```typescript
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
    // Auto-prize check
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
```

- [ ] Remove the `redeemPrize` function entirely (no longer needed).

- [ ] Commit: `git add src/app/parent/page.tsx && git commit -m "feat: auto-award prize when 10 unredeemed stars reached"`

---

## Task 3: Remove manual "Award Prize" button from ChildCard

**File:** `src/components/ChildCard.tsx`

The button is no longer needed. Remove `onRedeemPrize` prop and the button.

- [ ] Remove `onRedeemPrize` from the interface and destructuring:

```typescript
interface ChildCardProps {
  child: Child;
  stars: Star[];
  prizes: Prize[];
  isParent?: boolean;
  todayStar?: Star | null;
  onToggleStar?: () => void;
  // onRedeemPrize removed
}

export default function ChildCard({
  child,
  stars,
  prizes,
  isParent = false,
  todayStar,
  onToggleStar,
}: ChildCardProps) {
```

- [ ] Delete the `{canRedeem && <button onClick={onRedeemPrize}>Award Prize 🎁</button>}` block. Keep the "🎉 Prize ready!" text — it shows briefly before auto-prize fires.

- [ ] In `parent/page.tsx`, remove `onRedeemPrize={() => redeemPrize(child.id)}` from the `<ChildCard>` call.

- [ ] Commit: `git add src/components/ChildCard.tsx src/app/parent/page.tsx && git commit -m "feat: remove manual award prize button, auto-prize replaces it"`

---

## Task 4: Interactive 28-day history grid (retro star adding)

**File:** `src/app/parent/page.tsx`

Replace the static 7-day row with a 4-week interactive grid. Clicking any day toggles that day's star.

- [ ] Replace the `last7Days` computation and the static history `<div>` with this:

```typescript
// 28-day grid: 4 rows (weeks), 7 cols (Sun–Sat)
// Replace the const last7Days block and the history JSX block with:

const last28Days = Array.from({ length: 28 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (27 - i));
  return d.toISOString().split("T")[0];
});
const today = getToday();
```

And replace the `{/* 7-day history */}` JSX block with:

```tsx
{/* 28-day history grid */}
<div className="bg-white/60 rounded-2xl p-4">
  <h3 className="text-sm font-bold text-gray-500 mb-3">History (tap to edit)</h3>
  <div className="grid grid-cols-7 gap-1">
    {["S","M","T","W","T","F","S"].map((d, i) => (
      <div key={i} className="text-center text-xs text-gray-400 pb-1">{d}</div>
    ))}
    {last28Days.map((date) => {
      const hasStar = childStars.some((s) => s.date === date);
      const isFuture = date > today;
      const isToday = date === today;
      return (
        <button
          key={date}
          disabled={isFuture}
          onClick={() => !isFuture && toggleStar(child.id, date)}
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
```

- [ ] Remove the old `const last7Days` block (it's now replaced by `last28Days` above).

- [ ] Remove the old `const today = getToday()` line near the top of the render (after the `if (loading)` check) — `today` is now defined inside the `last28Days` block. Actually, move the `const today = getToday()` to just before `last28Days` to keep it accessible. Also remove `today` from `const todayStar = childStars.find((s) => s.date === today)` — update to use `getToday()` directly or keep `today` defined once at the top of the render:

```typescript
// At the top of the render return block (before the children.map):
const today = getToday();
```

- [ ] Update `onToggleStar` call in ChildCard to pass today: change `onToggleStar={() => toggleStar(child.id)}` → `onToggleStar={() => toggleStar(child.id, today)}`

- [ ] Commit: `git add src/app/parent/page.tsx && git commit -m "feat: replace 7-day static row with interactive 28-day history grid"`

---

## Task 5: Prize history on kids view

**File:** `src/app/page.tsx`

Show kids a "Prizes won" section so they can see their history.

- [ ] After the `{children.map(...)}` block in `page.tsx`, add:

```tsx
{prizes.length > 0 && (
  <div className="w-full max-w-md bg-white/60 rounded-2xl p-4 mt-2">
    <h2 className="text-sm font-bold text-gray-500 mb-3">Prizes Won 🏆</h2>
    <div className="flex flex-col gap-2">
      {prizes.map((prize) => {
        const child = children.find((c) => c.id === prize.child_id);
        return (
          <div key={prize.id} className="flex items-center gap-2 text-sm">
            <span>{child?.avatar_emoji}</span>
            <span className="font-medium text-gray-700">{child?.name}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">
              {new Date(prize.redeemed_at).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="ml-auto">🎁</span>
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] Commit: `git add src/app/page.tsx && git commit -m "feat: add prize history section to kids view"`

---

## Task 6: Push and verify

- [ ] `git push origin main` — Vercel auto-deploys (takes ~45s)

- [ ] Open `https://tablestars.erapps.xyz/parent` and verify:
  - 28-day grid shows with existing stars filled
  - Tapping a past empty day adds a star (no page needed to refresh, loadData called)
  - Tapping a filled past day removes it
  - Adding the 10th unredeemed star fires confetti automatically — no button pressed
  - No "Award Prize" button appears anywhere

- [ ] Open `https://tablestars.erapps.xyz` and verify:
  - "Prizes Won 🏆" section appears if prizes exist
  - Shows child name + emoji + date for each prize

---

## Notes
- The `last28Days.reverse()` in the old code was a bug (`.reverse()` mutates in place and runs twice per render). The new code builds the array already in chronological order (oldest → newest left-to-right, top-to-bottom), so no `.reverse()` needed.
- The 7-column grid naturally aligns to Sun–Sat only if today happens to be Saturday. This is cosmetic — the day-letter headers are decorative, not aligned to actual calendar weeks. Acceptable for this use case.
