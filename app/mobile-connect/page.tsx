import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MobileGoogleSignIn } from "@/app/mobile-connect/mobile-google-sign-in";
import { createMobileLoginCode } from "@/lib/mobile-auth";

type Props = {
  searchParams: Promise<{ redirect?: string; choose?: string }>;
};

export default async function MobileConnectPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectUri = params.redirect === "planejei://auth" ? params.redirect : "planejei://auth";
  const session = await auth();
  const chooseAccount = params.choose === "1";

  if (!session?.user?.id || chooseAccount) {
    const callbackUrl = `/mobile-connect?redirect=${encodeURIComponent(redirectUri)}`;
    return <MobileGoogleSignIn callbackUrl={callbackUrl} clearExistingSession={Boolean(session?.user?.id)} />;
  }

  const code = await createMobileLoginCode(session.user.id);
  const callback = new URL(redirectUri);
  callback.searchParams.set("code", code);
  redirect(callback.toString());
}
