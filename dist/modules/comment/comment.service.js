"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const model_1 = require("../../DB/model");
const post_1 = require("../post");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class CommentService {
    userModel = new repository_1.userRepository(model_1.UserModel);
    postModel = new repository_1.PostRepository(model_1.PostModel);
    commentModel = new repository_1.CommentRepository(model_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComment: model_1.AllowCommentEnum.allow,
                $or: (0, post_1.postAvailability)(req),
            },
        });
        if (!post) {
            throw new error_response_1.NotFoundRequestException("Fail To Find Matching Result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags }, freezeAt: { $exists: false } },
            }))?.length !== req.body.tags.length) {
            throw new error_response_1.NotFoundRequestException("Some Of The Mentioned Users Are Not Exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
            });
        }
        const [comment] = (await this.commentModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail To Create This Comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    replyComment = async (req, res) => {
        const { postId, commentId } = req.params;
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
                            allowComments: model_1.AllowCommentEnum.allow,
                            $or: (0, post_1.postAvailability)(req),
                        },
                    },
                ],
            },
        });
        if (!comment || !comment.postId) {
            throw new error_response_1.NotFoundRequestException("fail to find matching result");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags }, freezeAt: { $exists: false } },
            }))?.length !== req.body.tags.length) {
            throw new error_response_1.NotFoundRequestException("Some Of The Mentioned Users Are Not Exist");
        }
        let attachments = [];
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                storageApproach: cloud_multer_1.StorageEnum.memory,
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`,
                files: req.files,
            });
        }
        const [reply] = (await this.commentModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("fail to create this comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
}
exports.default = new CommentService();
