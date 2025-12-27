import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev",
});

export const config = { matcher: ["/"] }; // Protect root (and implicitly others if we expand matcher)
