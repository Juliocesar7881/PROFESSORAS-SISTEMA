import { logServerError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: "ok",
      database: "ok",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    logServerError("[health] database check failed", error, { requestId });

    return Response.json(
      {
        status: "degraded",
        database: "unavailable",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 503 },
    );
  }
}
