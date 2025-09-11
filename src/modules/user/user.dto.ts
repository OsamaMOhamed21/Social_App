import { z } from "zod";
import {
  freezeAccount,
  hardDeleteAccount,
  logout,
  restoreAccount,
} from "./user.validation";

export type ILogout = z.infer<typeof logout.body>;
export type IFreezeAccount = z.infer<typeof freezeAccount.params>;
export type IRestoreAccount = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccount = z.infer<typeof hardDeleteAccount.params>;
