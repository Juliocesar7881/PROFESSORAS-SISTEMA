import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserRepository } from "@/repositories/user.repository";

const hasAnyTurmaCached = unstable_cache(
  async (userId: string) => {
    const userRepository = new UserRepository();
    return userRepository.hasAnyTurma(userId);
  },
  ["has-any-turma"],
  { revalidate: 180 },
);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const trialExpired = Boolean(session.user.trialExpired);

  const hasTurma = await hasAnyTurmaCached(session.user.id);

  if (!hasTurma && !trialExpired) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      userName={session.user.name ?? "Professora"}
      userPlano={session.user.plano}
      trialExpired={trialExpired}
      trialDaysLeft={Number(session.user.trialDaysLeft ?? 0)}
      trialEndsAt={session.user.trialEndsAt ?? null}
    >
      {children}
    </DashboardShell>
  );
}
