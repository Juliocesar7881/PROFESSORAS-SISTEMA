import { DefaultSession } from "next-auth";
import { Plano } from "@prisma/client";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plano: Plano;
      trialEndsAt: string | null;
      trialDaysLeft: number;
      trialExpired: boolean;
      requiresUpgrade: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    plano?: Plano;
    createdAt?: Date;
    trialEndsAt?: string | null;
    trialDaysLeft?: number;
    trialExpired?: boolean;
    requiresUpgrade?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    plano?: Plano;
    trialEndsAt?: string | null;
    trialDaysLeft?: number;
    trialExpired?: boolean;
    requiresUpgrade?: boolean;
  }
}
