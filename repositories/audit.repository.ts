import { prisma } from "@/lib/prisma";

interface AuditPayload {
  userId: string;
  action: string;
  resource: string;
  ip?: string | null;
  userAgent?: string | null;
}

export class AuditRepository {
  async log(payload: AuditPayload) {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        resource: payload.resource,
        ip: payload.ip,
        userAgent: payload.userAgent,
      },
    });
  }

  async purgeOlderThan(date: Date) {
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}
