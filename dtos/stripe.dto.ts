import { z } from "zod";

export const createCheckoutSchema = z.object({
  ciclo: z.enum(["mensal", "anual"]),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
