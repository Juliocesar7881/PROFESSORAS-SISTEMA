import { env } from "@/lib/env";
import { AccountController } from "@/controllers/account.controller";

const controller = new AccountController();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return controller.runCleanup();
}
