import Link from "next/link";
import { getDb } from "@/lib/db";
import type { Child, Star, Prize } from "@/lib/types";
import ChildCard from "@/components/ChildCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sql = getDb();

  const [children, stars, prizes] = await Promise.all([
    sql`SELECT * FROM children ORDER BY created_at` as unknown as Promise<Child[]>,
    sql`SELECT * FROM stars ORDER BY date DESC` as unknown as Promise<Star[]>,
    sql`SELECT * FROM prizes ORDER BY redeemed_at DESC` as unknown as Promise<Prize[]>,
  ]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-md mx-auto w-full">
      <h1 className="text-3xl font-extrabold text-purple-600 text-center">
        Table Stars ⭐
      </h1>
      <p className="text-gray-500 text-center -mt-2">
        Eat nicely, earn stars, win prizes!
      </p>

      {children.map((child) => (
        <ChildCard
          key={child.id}
          child={child}
          stars={stars.filter((s) => s.child_id === child.id)}
          prizes={prizes.filter((p) => p.child_id === child.id)}
        />
      ))}

      {prizes.length > 0 && (
        <div className="w-full bg-white/60 rounded-2xl p-4 mt-2">
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

      <Link
        href="/parent"
        className="text-sm text-purple-400 hover:text-purple-600 transition-colors mt-4"
      >
        Parent Login →
      </Link>
    </main>
  );
}
