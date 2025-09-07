import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./auth.validation";
import authService from "./auth.service";
const router: Router = Router();

router.post("/signup", validation(validators.signup), authService.signup);


router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  authService.confirmEmail
);


router.post("/login", validation(validators.login), authService.login);


router.post(
  "/signup-gmail",
  validation(validators.signupWithGmail),
  authService.signupWithGmail
);
router.post(
  "/login-gmail",
  validation(validators.signupWithGmail),
  authService.loginWithGmail
);



router.patch(
  "/send-forgot-password",
  validation(validators.sendForgotPasswordCode),
  authService.sendForgotCode
);
router.patch(
  "/send-verify-password",
  validation(validators.verifyPasswordCode),
  authService.verifyPasswordCode
);
router.patch(
  "/reset-verify-password",
  validation(validators.resetVerifyPassword),
  authService.resetVerifyPassword
);

export default router;
