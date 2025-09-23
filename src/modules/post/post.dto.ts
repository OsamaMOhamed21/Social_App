import { z } from "zod";
import { likePost, updatePost } from "./post.validation";

export type LikePostQueryDto = z.infer<typeof likePost.query>;
export type LikePostParamsDto = z.infer<typeof likePost.params>;
export type IUpdatePostParamsDto = z.infer<typeof updatePost.params>;
