import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const latestVersion = process.env.ANDROID_LATEST_VERSION || "1.3.3";
  const minimumVersion = process.env.ANDROID_MINIMUM_VERSION || "1.2.1";
  return ok({
    latestVersion,
    minimumVersion,
    apkUrl: process.env.NEXT_PUBLIC_ANDROID_APK_URL || null,
    maintenance: false,
  });
}
