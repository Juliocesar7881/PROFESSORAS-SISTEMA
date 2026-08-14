import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  redirect("/dashboard/projetos");
}
