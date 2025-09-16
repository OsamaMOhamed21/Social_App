"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/model/user.model");
const token_security_1 = require("../../utils/security/token.security");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_event_1 = require("../../utils/multer/s3.event");
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../DB/repository");
const hash_security_1 = require("../../utils/security/hash.security");
const otp_1 = require("../../utils/otp");
const email_event_1 = require("../../utils/email/email.event");
class UserService {
    userModel = new repository_1.userRepository(user_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.UnauthorizedException("Missing Details User");
        }
        return (0, success_response_1.successResponse)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    profileImage = async (req, res) => {
        const { ContentType, Originalname, } = req.body;
        const { url, Key } = await (0, s3_config_1.createPreSignedUploadLink)({
            ContentType,
            Originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: Key,
                temProfileImage: req.user?.profileImage,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail To Update User Profile Image");
        }
        s3_event_1.s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            Key,
            expiresIn: 30000,
        });
        return (0, success_response_1.successResponse)({ res, data: { url } });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                freezeBy: { $ne: userId },
            },
            update: {
                restoreAt: new Date(),
                restoreBy: req.user?._id,
                $unset: { freezeAt: 1, freezeBy: 1 },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundRequestException("User Not Found Or Fail Restore Resource");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezeBy: { $exists: true },
            },
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundRequestException("User Not Found Or Fail Delete This Resource");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({ res });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== user_model_1.RoleEnum.admin) {
            throw new error_response_1.ForbiddenException("Not Authorized User");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezeAt: { $exists: false },
            },
            update: {
                freezeAt: new Date(),
                freezeBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: { restoreAt: 1, restoreBy: 1 },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundRequestException("User Not Found Or Fail Delete Resource");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
            useLager: true,
        });
        const user = this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                coverImage: urls,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail To Upload Profile Cover Images");
        }
        if (req.user?.coverImage) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user.coverImage });
        }
        return res.json({ message: "Done", data: { urls } });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return (0, success_response_1.successResponse)({ res, statusCode });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 201,
            data: { credentials },
        });
    };
    updateBasicInfo = async (req, res) => {
        const userId = req.user?._id;
        const { firstName, lastName, phone } = req.body;
        const user = await this.userModel.findByIdAndUpdate({
            id: userId,
            update: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone && { phone }),
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundRequestException("User Not Found");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    updatePassword = async (req, res) => {
        const { oldPassword, password, flag } = req.body;
        if (!(await (0, hash_security_1.compareHash)(oldPassword, req.user?.password))) {
            throw new error_response_1.NotFoundRequestException("In-valid Login Data");
        }
        for (const historyPassword of req.user?.historyPassword || []) {
            if (await (0, hash_security_1.compareHash)(password, historyPassword)) {
                throw new error_response_1.BadRequestException("This is password is used before");
            }
        }
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id,
                provider: user_model_1.ProviderEnum.SYSTEM,
            },
            update: {
                $set: {
                    password: await (0, hash_security_1.generateHash)(password),
                    ...update,
                },
                $push: { historyPassword: req.user?.password },
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("In-valid Account");
        }
        return (0, success_response_1.successResponse)({ res, statusCode, data: { user } });
    };
    updateEmail = async (req, res) => {
        const { newEmail } = req.body;
        if (!req.user?.id) {
            throw new error_response_1.NotFoundRequestException("Invalid User");
        }
        const existEmail = await this.userModel.findOne({
            filter: { email: newEmail },
        });
        if (existEmail) {
            throw new error_response_1.BadRequestException("Email already in use");
        }
        const otp = (0, otp_1.generateOtp)();
        const hashedOtp = await (0, hash_security_1.generateHash)(String(otp));
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id,
                provider: user_model_1.ProviderEnum.SYSTEM,
            },
            update: {
                $set: {
                    pendingEmail: newEmail,
                    confirmEmailOtp: hashedOtp,
                },
                $unset: { confirmAt: 1 },
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Failed to update email");
        }
        email_event_1.emailEvent.emit("confirmEmail", { to: newEmail, otp });
        return (0, success_response_1.successResponse)({ res });
    };
    confirmPendingEmail = async (req, res) => {
        const { pendingEmail, otp } = req.body;
        if (!pendingEmail || !otp) {
            throw new error_response_1.BadRequestException("pendingEmail and otp are required");
        }
        const user = await this.userModel.findOne({
            filter: {
                pendingEmail,
                confirmEmailOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareHash)(String(otp), user.confirmEmailOtp))) {
            throw new ConflictException("Invalid Confirm");
        }
        await this.userModel.updateOne({
            filter: { _id: user._id },
            update: {
                $set: {
                    email: user.pendingEmail,
                    confirmAt: new Date(),
                },
                $unset: { confirmEmailOtp: 1, pendingEmail: 1 },
            },
        });
        return (0, success_response_1.successResponse)({ res, message: "Email confirmed successfully" });
    };
}
exports.default = new UserService();
