import { z } from "zod";
import {
  confirmPendingEmail,
  freezeAccount,
  hardDeleteAccount,
  logout,
  restoreAccount,
  updateEmail,
  updatePassword,
} from "./user.validation";

export type ILogout = z.infer<typeof logout.body>;
export type IFreezeAccount = z.infer<typeof freezeAccount.params>;
export type IRestoreAccount = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccount = z.infer<typeof hardDeleteAccount.params>;
export type IUpdatePassword = z.infer<typeof updatePassword.body>;
export type IUpdatePasswordQuery = z.infer<typeof updatePassword.query>;
export type IUpdateEmail = z.infer<typeof updateEmail.body>;
export type IConfirmPendingEmail = z.infer<typeof confirmPendingEmail.body>;
