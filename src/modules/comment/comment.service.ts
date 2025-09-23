import type { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  CommentRepository,
  PostRepository,
  userRepository,
} from "../../DB/repository";
import {
  AllowCommentEnum,
  CommentModel,
  HPostDemount,
  PostModel,
  UserModel,
} from "../../DB/model";
import { Types } from "mongoose";
import { postAvailability } from "../post";
import {
  BadRequestException,
  NotFoundRequestException,
} from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";

class CommentService {
  private userModel = new userRepository(UserModel);
  private postModel = new PostRepository(PostModel);
  private commentModel = new CommentRepository(CommentModel);
  constructor() {}
  createComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        allowComment: AllowCommentEnum.allow,
        $or: postAvailability(req),
      },
    });

    if (!post) {
      throw new NotFoundRequestException("Fail To Find Matching Result");
    }

    if (
      req.body.tags?.length &&
      (
        await this.userModel.find({
          filter: { _id: { $in: req.body.tags }, freezeAt: { $exists: false } },
        })
      )?.length !== req.body.tags.length
    ) {
      throw new NotFoundRequestException(
        "Some Of The Mentioned Users Are Not Exist"
      );
    }

    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
      });
    }

    const [comment] =
      (await this.commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail To Create This Comment");
    }

    return successResponse({ res, statusCode: 201 });
  };

  replyComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };
    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        post: postId,
      },
      options: {
        populate: [
          {
            path: "postId",
            match: {
              allowComments: AllowCommentEnum.allow,
              $or: postAvailability(req),
            },
          },
        ],
      },
    });

    if (!comment || !comment.postId) {
      throw new NotFoundRequestException("fail to find matching result");
    }

    if (
      req.body.tags?.length &&
      (
        await this.userModel.find({
          filter: { _id: { $in: req.body.tags }, freezeAt: { $exists: false } },
        })
      )?.length !== req.body.tags.length
    ) {
      throw new NotFoundRequestException(
        "Some Of The Mentioned Users Are Not Exist"
      );
    }

    let attachments: string[] = [];
    if (req.files?.length) {
      const post = comment.postId as Partial<HPostDemount>;
      attachments = await uploadFiles({
        storageApproach: StorageEnum.memory,
        path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
        files: req.files as Express.Multer.File[],
      });
    }

    const [reply] =
      (await this.commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            commentId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!reply) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("fail to create this comment");
    }

    return successResponse({ res, statusCode: 201 });
  };
}
export default new CommentService();
