import { z } from "zod";
import {  likePost } from "./post.validation";

export type LikePostQueryDto = z.infer<typeof likePost.query>;
export type LikePostParamsDto = z.infer<typeof likePost.params>;

