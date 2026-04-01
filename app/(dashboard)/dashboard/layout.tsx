import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { UserRepository } from "@/repositories/user.repository";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!hasReachableDatabase) {
    return (
      <DashboardShell userName={session.user.name ?? "Professora"} userPlano={session.user.plano}>
        {children}
      </DashboardShell>
    );
  }

  const userRepository = new UserRepository();
  const hasTurma = await userRepository.hasAnyTurma(session.user.id);

  if (!hasTurma) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell userName={session.user.name ?? "Professora"} userPlano={session.user.plano}>
      {children}
    </DashboardShell>
  );
}
