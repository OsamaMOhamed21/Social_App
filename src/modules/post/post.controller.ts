import { Router } from "express";
import PostService from "./post.service";
import * as validators from "./post.validation";
import { authentication } from "../../middleware/authentication.middleware";
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import { validation } from "../../middleware/validation.middleware";
const router = Router();

router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.createPost),
  PostService.createPost
);

router.patch(
  "/:postId/like",
  authentication(),
  validation(validators.likePost),
  PostService.likePost
);
export default router;
