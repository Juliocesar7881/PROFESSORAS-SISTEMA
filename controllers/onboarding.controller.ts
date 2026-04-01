import { onboardingSchema } from "@/dtos/onboarding.dto";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { OnboardingService } from "@/services/onboarding.service";

export class OnboardingController {
  private readonly onboardingService = new OnboardingService();

  create = async (request: Request, context: RequestContext) => {
    try {
      const payload = onboardingSchema.parse(await request.json());
      const result = await this.onboardingService.run(context.userId!, payload);
      return ok(result, 201);
    } catch (error) {
      return fail(error);
    }
  };
}
