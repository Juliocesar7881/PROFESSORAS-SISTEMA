import { OnboardingController } from "@/controllers/onboarding.controller";
import { route, withAudit, withAuth } from "@/middleware/api";

const controller = new OnboardingController();

export const POST = route(controller.create, [
  withAuth,
  withAudit({ action: "ONBOARDING_CREATE", resource: "onboarding" }),
]);
