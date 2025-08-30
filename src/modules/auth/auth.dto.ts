import * as validators from "./auth.validation";
import { z } from "zod";

export type ISignupDTO = z.infer<typeof validators.signup.body>;
