import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { hasReachableDatabaseUrl } from "@/lib/runtime";
import { UserRepository } from "@/repositories/user.repository";

const hasReachableDatabase = hasReachableDatabaseUrl(process.env.DATABASE_URL);

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!hasReachableDatabase) {
    redirect("/dashboard");
  }

  const userRepository = new UserRepository();
  const hasTurma = await userRepository.hasAnyTurma(session.user.id);

  if (hasTurma) {
    redirect("/dashboard");
  }

  return <OnboardingWizard userName={session.user.name ?? "Professora"} userImage={session.user.image} />;
}
