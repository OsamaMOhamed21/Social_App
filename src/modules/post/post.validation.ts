import { z } from "zod";
import {
  AllowCommentEnum,
  AvailabilityEnum,
  LikeActionEnum,
} from "../../DB/model/post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const createPost = {
  body: z
    .strictObject({
      content: z.string().min(2).max(50000).optional(),
      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),

      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
      allowComments: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow),

      tags: z.array(generalFields.id).max(10).optional(),
      likes: z.array(generalFields.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Sorry We Cannot Make Post Without Content And Attachments",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Duplicated Tagged Users",
        });
      }
    }),
};

export const updatePost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(50000).optional(),

      availability: z.enum(AvailabilityEnum).optional(),
      allowComments: z.enum(AllowCommentEnum).optional(),

      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),
      removedAttachment: z.array(z.string()).max(2).optional(),

      tags: z.array(generalFields.id).max(10).optional(),
      removedTags: z.array(generalFields.id).max(10).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.values(data).length) {
        ctx.addIssue({
          code: "custom",
          message: "All Fields Are Empty",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Duplicated Tagged Users",
        });
      }

      if (
        data.removedTags?.length &&
        data.removedTags.length !== [...new Set(data.removedTags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["removedTags"],
          message: "Duplicated Removed Tagged Users",
        });
      }
    }),
};

export const likePost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  query: z.strictObject({
    action: z.enum(LikeActionEnum).default(LikeActionEnum.like),
  }),
};
