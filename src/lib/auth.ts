import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "elulrif@gmail.com",
  "schwartzliron@gmail.com",
];

// `vercel env add` via `echo` stores a trailing \n in the value (see AGENTS.md
// gotcha). A trailing newline on AUTH_GOOGLE_SECRET makes Google's token
// endpoint return `invalid_client`; on AUTH_SECRET it breaks cookie signing.
const trim = (v: string | undefined) => v?.trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: trim(process.env.AUTH_SECRET),
  providers: [
    Google({
      clientId: trim(process.env.AUTH_GOOGLE_ID),
      clientSecret: trim(process.env.AUTH_GOOGLE_SECRET),
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      return ALLOWED_EMAILS.includes(profile?.email ?? "");
    },
  },
  logger: {
    error(error) {
      const cause = (error as { cause?: unknown }).cause;
      console.error("[auth] error:", {
        name: error.name,
        message: error.message,
        cause,
        causeJson: (() => {
          try { return JSON.stringify(cause, Object.getOwnPropertyNames(cause ?? {})); }
          catch { return String(cause); }
        })(),
      });
    },
  },
});
