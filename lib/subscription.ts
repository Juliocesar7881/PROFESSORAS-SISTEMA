const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FREE_TRIAL_DAYS = 14;
export const MONTHLY_PRICE_CENTS = 1899;
export const YEARLY_PRICE_CENTS = 15000;
export const MONTHLY_PRICE_LABEL = "R$18,99";
export const YEARLY_PRICE_LABEL = "R$150,00";

export function isProPlan(plan: string | null | undefined) {
  return String(plan ?? "").toUpperCase() === "PRO";
}

function coerceDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTrialStatus(params: {
  createdAt: Date | string | null | undefined;
  plan: string | null | undefined;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const trialStart = coerceDate(params.createdAt) ?? now;
  const trialEndsAt = new Date(trialStart.getTime() + FREE_TRIAL_DAYS * MS_PER_DAY);

  if (isProPlan(params.plan)) {
    return {
      trialEndsAt: trialEndsAt.toISOString(),
      trialDaysLeft: 0,
      trialExpired: false,
      requiresUpgrade: false,
    };
  }

  const remainingMs = trialEndsAt.getTime() - now.getTime();
  const trialExpired = remainingMs <= 0;

  return {
    trialEndsAt: trialEndsAt.toISOString(),
    trialDaysLeft: trialExpired ? 0 : Math.ceil(remainingMs / MS_PER_DAY),
    trialExpired,
    requiresUpgrade: trialExpired,
  };
}
