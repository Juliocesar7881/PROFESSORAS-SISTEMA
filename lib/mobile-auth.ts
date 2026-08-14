import { createHash, randomBytes } from "node:crypto";

import { Plano } from "@prisma/client";

import { UnauthorizedError, ValidationError } from "@/dtos/errors";
import { prisma } from "@/lib/prisma";

const MOBILE_SESSION_DAYS = 30;
const LOGIN_CODE_MINUTES = 5;

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function opaqueToken(prefix: string, bytes = 32) {
  return `${prefix}_${randomBytes(bytes).toString("base64url")}`;
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authenticateMobileRequest(request: Request) {
  const token = extractBearerToken(request);
  if (!token?.startsWith("pm_")) return null;

  const tokenHash = hashToken(token);
  const now = new Date();
  const session = await prisma.mobileSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plano: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= now) {
    throw new UnauthorizedError("Sessao do aplicativo expirada. Entre novamente.");
  }

  if (now.getTime() - session.lastUsedAt.getTime() > 24 * 60 * 60 * 1000) {
    await prisma.mobileSession.update({
      where: { id: session.id },
      data: {
        lastUsedAt: now,
        expiresAt: new Date(now.getTime() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  }

  return {
    sessionId: session.id,
    user: session.user,
    plan: session.user.plano ?? Plano.GRATUITO,
  };
}

export async function createMobileLoginCode(userId: string) {
  const code = opaqueToken("mc", 24);
  const now = new Date();

  await prisma.mobileLoginCode.create({
    data: {
      userId,
      codeHash: hashToken(code),
      expiresAt: new Date(now.getTime() + LOGIN_CODE_MINUTES * 60 * 1000),
    },
  });

  return code;
}

export async function exchangeMobileLoginCode(code: string, deviceName?: string) {
  if (!code.startsWith("mc_")) throw new ValidationError("Codigo do aplicativo invalido.");
  const now = new Date();
  const codeHash = hashToken(code);
  const token = opaqueToken("pm");

  return prisma.$transaction(async (tx) => {
    const loginCode = await tx.mobileLoginCode.findUnique({
      where: { codeHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            plano: true,
          },
        },
      },
    });

    if (!loginCode || loginCode.usedAt || loginCode.expiresAt <= now) {
      throw new UnauthorizedError("Codigo expirado. Inicie o login novamente.");
    }

    await tx.mobileLoginCode.update({
      where: { id: loginCode.id },
      data: { usedAt: now },
    });

    const session = await tx.mobileSession.create({
      data: {
        userId: loginCode.userId,
        tokenHash: hashToken(token),
        deviceName: deviceName?.trim().slice(0, 120) || null,
        expiresAt: new Date(now.getTime() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      token,
      expiresAt: session.expiresAt,
      user: loginCode.user,
    };
  });
}

export async function revokeMobileSession(request: Request) {
  const token = extractBearerToken(request);
  if (!token) throw new UnauthorizedError();

  await prisma.mobileSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
