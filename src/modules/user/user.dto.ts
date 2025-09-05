import { z } from "zod";
import { logout } from "./user.validation";

export type ILogout = z.infer<typeof logout.body>;
