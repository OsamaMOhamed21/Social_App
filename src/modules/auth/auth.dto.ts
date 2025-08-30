import * as validators from "./auth.validation";
import { z } from "zod";

export type ISignupDTO = z.infer<typeof validators.signup.body>;
export type IConfirmEmail = z.infer<typeof validators.confirmEmail.body>;
