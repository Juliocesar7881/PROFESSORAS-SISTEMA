import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { AccountService } from "@/services/account.service";

export class AccountController {
  private readonly accountService = new AccountService();

  logoutEverywhere = async (_request: Request, context: RequestContext) => {
    try {
      const data = await this.accountService.logoutEverywhere(context.userId!);
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };

  deleteAccount = async (_request: Request, context: RequestContext) => {
    try {
      const data = await this.accountService.deleteAccount(context.userId!);
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };

  runCleanup = async () => {
    try {
      const data = await this.accountService.hardDeleteSoftDeletedRecords();
      return ok(data);
    } catch (error) {
      return fail(error);
    }
  };
}
