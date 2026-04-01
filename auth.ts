import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Plano } from "@prisma/client";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hasReachableDatabaseUrl } from "@/lib/runtime";

const hasReachableDatabase = hasReachableDatabaseUrl(env.DATABASE_URL);

const providers = [
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
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers,
  ...(hasReachableDatabase
    ? {
        adapter: PrismaAdapter(prisma),
        session: {
          strategy: "database" as const,
          maxAge: 60 * 60 * 24 * 30,
          updateAge: 0,
        },
      }
    : {
        session: {
          strategy: "jwt" as const,
          maxAge: 60 * 60 * 24 * 30,
          updateAge: 0,
        },
      }),
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        // OAuth callbacks originate from accounts.google.com; Lax ensures the
        // session cookie is sent on the first redirect back to our app.
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      if (!hasReachableDatabase) {
        const userId = typeof user?.id === "string" ? user.id : undefined;
        const profileSub = profile && "sub" in profile && typeof profile.sub === "string" ? profile.sub : undefined;
        const tokenEmail = typeof token.email === "string" ? token.email : undefined;
        token.id = (token.id as string | undefined) ?? userId ?? profileSub ?? token.sub ?? tokenEmail;
      }

      if (!token.plano) {
        token.plano = Plano.GRATUITO;
      }

      return token;
    },
    async session({ session, user, token }) {
      if (!session.user) {
        return session;
      }

      const tokenEmail = typeof token.email === "string" ? token.email : undefined;
      const jwtId = (token.id as string | undefined) ?? token.sub ?? tokenEmail;
      session.user.id = hasReachableDatabase ? user.id : (jwtId ?? "temp-user");
      session.user.plano = hasReachableDatabase
        ? (user as { plano?: Plano }).plano ?? Plano.GRATUITO
        : ((token.plano as Plano | undefined) ?? Plano.GRATUITO);
      return session;
    },
  },
});
