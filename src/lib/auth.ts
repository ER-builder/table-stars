import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "elulrif@gmail.com",
  "schwartzliron@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ profile }) {
      return ALLOWED_EMAILS.includes(profile?.email ?? "");
    },
  },
});
