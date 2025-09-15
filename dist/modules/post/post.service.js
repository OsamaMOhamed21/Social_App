"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const post_model_1 = require("../../DB/model/post.model");
const user_model_1 = require("../../DB/model/user.model");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
class PostService {
    postModel = new repository_1.PostRepository(post_model_1.PostModel);
    userModel = new repository_1.userRepository(user_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags }, freezeAt: { $exists: false } },
            }))?.length !== req.body.tags.length) {
            throw new error_response_1.NotFoundRequestException("Some Of The Mentioned Users Are Not Exist");
        }
        let attachments = [];
        let assetsFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetsFolderId}`,
            });
        }
        const [post] = (await this.postModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail To Create This Post");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === post_model_1.LikeActionEnum.unlike) {
            update = {
                $pull: {
                    likes: req.user?._id,
                },
            };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: { _id: postId },
            update,
        });
        if (!post) {
            throw new error_response_1.NotFoundRequestException("Invalid PostId Or Post Not Exist");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new PostService();
