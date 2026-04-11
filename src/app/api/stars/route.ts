import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { childId, date } = await req.json();
  const sql = getDb();

  // Check if star exists for this child+date
  const existing = await sql`
    SELECT id FROM stars WHERE child_id = ${childId} AND date = ${date}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM stars WHERE id = ${existing[0].id}`;
    return NextResponse.json({ action: "removed" });
  }

  // Insert new star
  await sql`
    INSERT INTO stars (child_id, date, awarded_by)
    VALUES (${childId}, ${date}, ${session.user.email})
  `;

  // Auto-prize: check if unredeemed stars hit 10
  const allStars = await sql`SELECT COUNT(*)::int AS count FROM stars WHERE child_id = ${childId}`;
  const allPrizes = await sql`SELECT COALESCE(SUM(stars_redeemed), 0)::int AS total FROM prizes WHERE child_id = ${childId}`;
  const unredeemed = allStars[0].count - allPrizes[0].total;

  if (unredeemed >= 10) {
    await sql`INSERT INTO prizes (child_id, stars_redeemed) VALUES (${childId}, 10)`;
    return NextResponse.json({ action: "added", autoPrize: true });
  }

  return NextResponse.json({ action: "added" });
}
