import { z } from "zod";

import { fail, ok } from "@/lib/http";
import {
  createMobileLoginCode,
  exchangeMobileLoginCode,
  revokeMobileSession,
} from "@/lib/mobile-auth";
import type { RequestContext } from "@/middleware/api";
import { prisma } from "@/lib/prisma";

const exchangeSchema = z.object({
  code: z.string().trim().min(10).max(200),
  deviceName: z.string().trim().max(120).optional(),
});

export class MobileAuthController {
  createCode = async (_request: Request, context: RequestContext) => {
    try {
      return ok({ code: await createMobileLoginCode(context.userId!), expiresInSeconds: 300 }, 201);
    } catch (error) {
      return fail(error);
    }
  };

  exchange = async (request: Request) => {
    try {
      const payload = exchangeSchema.parse(await request.json());
      return ok(await exchangeMobileLoginCode(payload.code, payload.deviceName), 201);
    } catch (error) {
      return fail(error);
    }
  };

  me = async (_request: Request, context: RequestContext) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: context.userId! },
        select: { id: true, name: true, email: true, image: true },
      });
      return ok({
        id: user?.id ?? context.userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
        authKind: context.authKind,
      });
    } catch (error) {
      return fail(error);
    }
  };

  logout = async (request: Request) => {
    try {
      await revokeMobileSession(request);
      return ok({ revoked: true });
    } catch (error) {
      return fail(error);
    }
  };
}
