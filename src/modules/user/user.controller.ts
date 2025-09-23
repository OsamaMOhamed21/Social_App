import { Router } from "express";
import userService from "./user.service";
import {
  authentication,
  authorization,
} from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validator from "./user.validation";
import { TokenEnum } from "../../utils/security/token.security";
import {
  cloudFileUpload,
  fileValidation,
  StorageEnum,
} from "../../utils/multer/cloud.multer";
import { endPoint } from "./user.authorization";
const router = Router();
router.get("/", authentication(), userService.profile);

router.get(
  "/dashboard",
  authorization(endPoint.dashboard),
  userService.dashboard
);

router.patch(
  "/:userId/change-role",
  authorization(endPoint.dashboard),
  validation(validator.changeRole),
  userService.changeRole
);

router.delete(
  "{/:userId}/freeze-account",
  authentication(),
  validation(validator.freezeAccount),
  userService.freezeAccount
);

router.patch(
  "/:userId/restore-account",
  authorization(endPoint.restoreAccount),
  validation(validator.restoreAccount),
  userService.restoreAccount
);

router.patch(
  "/:userId/restore-account",
  authorization(endPoint.restoreAccount),
  validation(validator.restoreAccount),
  userService.restoreAccount
);

router.delete(
  "/:userId",
  authorization(endPoint.hardDeleteAccount),
  validation(validator.hardDeleteAccount),
  userService.hardDeleteAccount
);

router.patch("/profile-image", authentication(), userService.profileImage);

router.patch(
  "/profile-cover-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach: StorageEnum.disk,
  }).array("images", 2),
  userService.profileCoverImage
);

router.patch("/profile-image", authentication(), userService.profileImage);

router.patch(
  "/update-email",
  validation(validator.updateEmail),
  authentication(),
  userService.updateEmail
);

router.patch(
  "/confirm-pending-email",
  authentication(),
  validation(validator.confirmPendingEmail),
  userService.confirmPendingEmail
);

router.patch(
  "/update-user",
  authentication(),
  validation(validator.updateBasicInfo),
  userService.updateBasicInfo
);

router.post(
  "/logout",
  authentication(),
  validation(validator.logout),
  userService.logout
);

router.post(
  "/refresh-token",
  authentication(TokenEnum.refresh),
  userService.refreshToken
);
router.patch(
  "/update-password",
  validation(validator.updatePassword),
  authentication(),
  userService.updatePassword
);

export default router;
