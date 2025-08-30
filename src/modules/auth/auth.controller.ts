import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./auth.validation";
import authService from "./auth.service";
const router: Router = Router();

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/login", validation(validators.login), authService.login);

export default router;
