import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validator from "./user.validation";
import { TokenEnum } from "../../utils/security/token.security";
import {
  cloudFileUpload,
  fileValidation,
  StorageEnum,
} from "../../utils/multer/cloud.multer";
const router = Router();
router.get("/", authentication(), userService.profile);

router.patch(
  "/profile-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach: StorageEnum.disk,
  }).single("image"),
  userService.profileImage
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
export default router;
