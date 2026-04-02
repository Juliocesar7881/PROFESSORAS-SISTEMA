import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";
import { AccountController } from "@/controllers/account.controller";

const controller = new AccountController();

function isSameToken(received: string | null, expected: string) {
  if (!received) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!isSameToken(authHeader, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return controller.runCleanup();
}
