import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR", {
    error: "Digite EXCLUIR para confirmar a remoção permanente da conta.",
  }),
});
