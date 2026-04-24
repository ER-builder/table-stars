import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = process.env.STATS_READ_KEY;
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT c.id, c.name, c.avatar_emoji,
      COUNT(DISTINCT s.id)::int AS total_stars,
      COUNT(DISTINCT p.id)::int AS prize_count,
      COALESCE(SUM(p.stars_redeemed), 0)::int AS redeemed,
      MAX(s.created_at) AS last_earned_at
    FROM children c
    LEFT JOIN stars s ON s.child_id = c.id
    LEFT JOIN prizes p ON p.child_id = c.id
    GROUP BY c.id, c.name, c.avatar_emoji
    ORDER BY c.created_at
  `;

  const kids = rows.map((r) => {
    const unredeemed = r.total_stars - r.redeemed;
    return {
      id: r.id,
      name: r.name,
      emoji: r.avatar_emoji,
      prize_count: r.prize_count,
      unredeemed,
      cycle_progress: unredeemed % 10,
      last_earned_at: r.last_earned_at,
    };
  });

  return NextResponse.json(
    { kids },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
