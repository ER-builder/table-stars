import { auth, signIn, signOut } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Child, Star, Prize } from "@/lib/types";
import ParentDashboard from "./ParentDashboard";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        <h1 className="text-3xl font-extrabold text-purple-600">
          Parent Login
        </h1>
        <p className="text-gray-500 text-center">
          Sign in to manage your children&apos;s stars
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/parent" });
          }}
        >
          <button
            type="submit"
            className="py-4 px-8 rounded-2xl font-bold text-lg bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition-all active:scale-95"
          >
            Sign in with Google
          </button>
        </form>
        <a
          href="/"
          className="text-sm text-purple-400 hover:text-purple-600"
        >
          ← Back to stars
        </a>
      </main>
    );
  }

  const sql = getDb();
  const [children, stars, prizes] = await Promise.all([
    sql`SELECT * FROM children ORDER BY created_at` as unknown as Promise<Child[]>,
    sql`SELECT * FROM stars ORDER BY date DESC` as unknown as Promise<Star[]>,
    sql`SELECT * FROM prizes ORDER BY redeemed_at DESC` as unknown as Promise<Prize[]>,
  ]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-extrabold text-purple-600">
          Parent Dashboard
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </form>
      </div>

      <ParentDashboard
        children={children}
        stars={stars}
        prizes={prizes}
      />

      <a
        href="/"
        className="text-sm text-purple-400 hover:text-purple-600 mt-4"
      >
        ← Kids view
      </a>
    </main>
  );
}
