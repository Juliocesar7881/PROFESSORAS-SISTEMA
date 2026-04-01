import { auth } from "@/auth";
import { UnauthorizedError } from "@/dtos/errors";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}
