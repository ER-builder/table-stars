import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = process.env.STATS_READ_KEY;
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sql = getDb();
  // Scalar subqueries, not JOINs — joining stars + prizes creates a cartesian
  // product that multiplies SUM(stars_redeemed) by the star count.
  const rows = await sql`
    SELECT
      c.id,
      c.name,
      c.avatar_emoji,
      (SELECT COUNT(*)::int FROM stars WHERE child_id = c.id) AS total_stars,
      (SELECT COUNT(*)::int FROM prizes WHERE child_id = c.id) AS prize_count,
      (SELECT COALESCE(SUM(stars_redeemed), 0)::int FROM prizes WHERE child_id = c.id) AS redeemed,
      (SELECT MAX(created_at) FROM stars WHERE child_id = c.id) AS last_earned_at
    FROM children c
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
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        // Keyed public endpoint — wildcard CORS is fine (data is non-sensitive
        // summary info and the key already gates reads).
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    },
  );
}
