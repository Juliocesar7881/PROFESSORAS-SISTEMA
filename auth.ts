import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Plano } from "@prisma/client";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getTrialStatus } from "@/lib/subscription";

const isProduction = env.NODE_ENV === "production";
const sessionCookieName = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      checks: ["pkce", "state"],
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 0,
  },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        // OAuth callbacks originate from accounts.google.com; Lax ensures the
        // session cookie is sent on the first redirect back to our app.
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (!session.user) {
        return session;
      }

      const plano = (user as { plano?: Plano }).plano ?? Plano.GRATUITO;
      const trialStatus = getTrialStatus({
        createdAt: (user as { createdAt?: Date | string | null }).createdAt,
        plan: plano,
      });

      session.user.id = user.id;
      session.user.plano = plano;
      session.user.trialEndsAt = trialStatus.trialEndsAt;
      session.user.trialDaysLeft = trialStatus.trialDaysLeft;
      session.user.trialExpired = trialStatus.trialExpired;
      session.user.requiresUpgrade = trialStatus.requiresUpgrade;
      return session;
    },
  },
});
