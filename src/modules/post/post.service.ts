import type { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, userRepository } from "../../DB/repository";
import {
  AvailabilityEnum,
  HPostDemount,
  LikeActionEnum,
  PostModel,
} from "../../DB/model/post.model";
import { UserModel } from "../../DB/model/user.model";
import {
  BadRequestException,
  NotFoundRequestException,
} from "../../utils/response/error.response";
import { v4 as uuid } from "uuid";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { IUpdatePostParamsDto, LikePostQueryDto } from "./post.dto";
import { Types, UpdateQuery } from "mongoose";

export const postAvailability = (req: Request) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tags: { $in: req.user?._id },
    },
  ];
};

class PostService {
  private postModel = new PostRepository(PostModel);
  private userModel = new userRepository(UserModel);
  constructor() {}

  createPost = async (req: Request, res: Response): Promise<Response> => {
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
    let assetsFolderId: string = uuid();
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/post/${assetsFolderId}`,
      });
    }

    const [post] =
      (await this.postModel.create({
        data: [
          {
            ...req.body,
            attachments,
            assetsFolderId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail To Create This Post");
    }

    return successResponse({ res, statusCode: 201 });
  };

  updatePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as IUpdatePostParamsDto;
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
      },
    });
    if (!post) {
      throw new NotFoundRequestException("Fail To Find Matching Result");
    }

    if (
      req.body.tags?.length &&
      (
        await this.userModel.find({
          filter: {
            _id: { $in: req.body.tags, $ne: req.user?._id },
            freezeAt: { $exists: false },
          },
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

    const updatePost = await this.postModel.updateOne({
      filter: {
        _id: post._id,
      },
      update: [
        {
          $set: {
            content: req.body.content,
            allowComment: req.body.allowComments || post.allowComment,
            availability: req.body.availability || post.availability,
            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    "$attachments",
                    req.body.removedAttachment || [],
                  ],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "$tags",
                    (req.body.removedTags || []).map((tag: string) => {
                      return Types.ObjectId.createFromHexString(tag);
                    }),
                  ],
                },
                (req.body.tags || []).map((tag: string) => {
                  return Types.ObjectId.createFromHexString(tag);
                }),
              ],
            },
          },
        },
      ],
    });

    if (!updatePost.matchedCount) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail To Create This Post");
    } else {
      if (req.body.removedAttachment?.length) {
        await deleteFiles({ urls: req.body.removedAttachment });
      }
    }

    return successResponse({ res });
  };

  likePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as { postId: string };
    const { action } = req.query as LikePostQueryDto;
    let update: UpdateQuery<HPostDemount> = {
      $addToSet: { likes: req.user?._id },
    };
    if (action === LikeActionEnum.unlike) {
      update = {
        $pull: {
          likes: req.user?._id,
        },
      };
    }
    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(req),
      },
      update,
    });
    if (!post) {
      throw new NotFoundRequestException("Invalid PostId Or Post Not Exist");
    }

    return successResponse({ res });
  };

  postList = async (req: Request, res: Response): Promise<Response> => {
    let { page, size } = req.query as unknown as {
      page: number;
      size: number;
    };
    const posts = await this.postModel.paginate({
      filter: {
        $or: postAvailability(req),
      },
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
              freezedAt: { $exists: false },
            },
            populate: [
              {
                path: "reply",
                match: {
                  commentId: { $exists: false },
                  freezedAt: { $exists: false },
                },
                populate: [
                  {
                    path: "reply",
                    match: {
                      commentId: { $exists: false },
                      freezedAt: { $exists: false },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      page,
      size,
    });

    return successResponse({ res, data: { posts } });
  };
}
export const postService = new PostService();
