import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sql = getDb();

  // Toggle: if delivered_at is null, set to NOW(); else clear it (undo).
  const rows = await sql`
    UPDATE prizes
    SET delivered_at = CASE WHEN delivered_at IS NULL THEN NOW() ELSE NULL END
    WHERE id = ${id}
    RETURNING delivered_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Prize not found" }, { status: 404 });
  }

  return NextResponse.json({ delivered_at: rows[0].delivered_at });
}
