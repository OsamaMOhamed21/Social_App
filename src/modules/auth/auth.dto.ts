import * as validators from "./auth.validation";
import { z } from "zod";

export type ISignupDTO = z.infer<typeof validators.signup.body>;
export type IConfirmEmailDTO = z.infer<typeof validators.confirmEmail.body>;
export type ILoginDTO = z.infer<typeof validators.login.body>;
export type IGmailDTO = z.infer<typeof validators.signupWithGmail.body>;
export type IForgotCodeDTO = z.infer< typeof validators.sendForgotPasswordCode.body>;
export type IVerifyCodeDTO = z.infer<typeof validators.verifyPasswordCode.body>;
export type IResetVerifyCodeDTO = z.infer<typeof validators.resetVerifyPassword.body>;
