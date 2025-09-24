import type { Request, Response } from "express";
import { UpdateQuery } from "mongoose";
import {
  HUserDocument,
  IUser,
  ProviderEnum,
  RoleEnum,
  UserModel,
} from "../../DB/model/user.model";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../utils/security/token.security";
import {
  IConfirmPendingEmail,
  IFreezeAccount,
  IHardDeleteAccount,
  ILogout,
  IRestoreAccount,
  IUpdateEmail,
  IUpdatePassword,
  IUpdatePasswordQuery,
} from "./user.dto";
import {
  createPreSignedUploadLink,
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from "../../utils/multer/s3.config";
import { JwtPayload } from "jsonwebtoken";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { Types } from "mongoose";
import {
  BadRequestException,
  conflictException,
  ForbiddenException,
  NotFoundRequestException,
  UnauthorizedException,
} from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3.event";
import { successResponse } from "../../utils/response/success.response";
import {
  IProfileImageResponse,
  IRefreshTokenResponse,
  IUserResponse,
} from "./user.entities";
import {
  friendRequestRepository,
  PostRepository,
  userRepository,
} from "../../DB/repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateOtp } from "../../utils/otp";
import { emailEvent } from "../../utils/email/email.event";
import { FriendRequestModel, PostModel } from "../../DB/model";

class UserService {
  private userModel = new userRepository(UserModel);
  private postModel = new PostRepository(PostModel);
  private friendRequestModel = new friendRequestRepository(FriendRequestModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    const profile = await this.userModel.findByID({
      id: req.user?._id as Types.ObjectId,
      options: {
        populate: [
          {
            path: "friends",
            select: "firstName lastName email gender profileImage",
          },
        ],
      },
    });

    if (!profile) {
      throw new NotFoundRequestException("fail to find your user profile");
    }

    return successResponse<IUserResponse>({ res, data: { user: profile } });
  };

  dashboard = async (req: Request, res: Response): Promise<Response> => {
    const results = await Promise.allSettled([
      this.userModel.find({ filter: {} }),
      this.postModel.find({ filter: {} }),
    ]);
    return successResponse({
      res,
      data: { results },
    });
  };

  changeRole = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    const { role }: { role: RoleEnum } = req.body;
    const denyRoles: RoleEnum[] = [role, RoleEnum.superAdmin];
    if (req.user?.role === RoleEnum.admin) {
      denyRoles.push(RoleEnum.admin);
    }
    const user = await this.userModel.findOneAndUpdate({
      filter: {
        _id: userId as Types.ObjectId,
        role: { $nin: denyRoles },
      },
      update: {
        role,
      },
    });

    if (!user) {
      throw new NotFoundRequestException("fail to find matching result");
    }

    return successResponse({
      res,
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    const {
      ContentType,
      Originalname,
    }: { ContentType: string; Originalname: string } = req.body;
    const { url, Key } = await createPreSignedUploadLink({
      ContentType,
      Originalname,
      path: `users/${req.decoded?._id}`,
    });

    const user = await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
        profileImage: Key,
        temProfileImage: req.user?.profileImage,
      },
    });

    if (!user) {
      throw new BadRequestException("Fail To Update User Profile Image");
    }

    s3Event.emit("trackProfileImageUpload", {
      userId: req.user?._id,
      oldKey: req.user?.profileImage,
      Key,
      expiresIn: 30000 /* MS */,
    });
    return successResponse<IProfileImageResponse>({ res, data: { url } });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IRestoreAccount;
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
      throw new NotFoundRequestException(
        "User Not Found Or Fail Restore Resource"
      );
    }

    return successResponse({ res });
  };

  hardDeleteAccount = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as IHardDeleteAccount;
    const user = await this.userModel.deleteOne({
      filter: {
        _id: userId,
        freezeBy: { $exists: true },
      },
    });

    if (!user.deletedCount) {
      throw new NotFoundRequestException(
        "User Not Found Or Fail Delete This Resource"
      );
    }

    await deleteFolderByPrefix({ path: `users/${userId}` });
    return successResponse({ res });
  };

  freezeAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = (req.params as IFreezeAccount) || {};
    if (userId && req.user?.role !== RoleEnum.admin) {
      throw new ForbiddenException("Not Authorized User");
    }

    const user = await this.userModel.updateOne({
      filter: {
        _id: userId || (req.user?._id as Types.ObjectId),
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
      throw new NotFoundRequestException(
        "User Not Found Or Fail Delete Resource"
      );
    }

    return successResponse({ res });
  };

  profileCoverImage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const urls = await uploadFiles({
      storageApproach: StorageEnum.disk,
      files: req.files as Express.Multer.File[],
      path: `users/${req.decoded?._id}/cover`,
      useLager: true,
    });

    const user = this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
        coverImage: urls,
      },
    });

    if (!user) {
      throw new BadRequestException("Fail To Upload Profile Cover Images");
    }

    if (req.user?.coverImage) {
      await deleteFiles({ urls: req.user.coverImage });
    }

    return res.json({ message: "Done", data: { urls } });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogout = req.body;

    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};
    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
      default:
        await createRevokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
    }

    await this.userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });

    return successResponse({ res, statusCode });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return successResponse<IRefreshTokenResponse>({
      res,
      statusCode: 201,
      data: { credentials },
    });
  };

  updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?._id;
    const { firstName, lastName, phone } = req.body;

    const user = await this.userModel.findByIdAndUpdate({
      id: userId as Types.ObjectId,
      update: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        slug: firstName + "-" + lastName,
      },
    });
    if (!user) {
      throw new NotFoundRequestException("User Not Found");
    }
    return successResponse({ res });
  };

  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    const { oldPassword, password }: IUpdatePassword = req.body;
    const { flag } = req.query as IUpdatePasswordQuery;
    if (!(await compareHash(oldPassword, req.user?.password as string))) {
      throw new NotFoundRequestException("In-valid Login Data");
    }
    for (const historyPassword of req.user?.historyPassword || []) {
      if (await compareHash(password, historyPassword)) {
        throw new BadRequestException("This is password is used before");
      }
    }
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};
    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
      default:
        await createRevokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
    }

    const user = await this.userModel.findOneAndUpdate({
      filter: {
        _id: req.user?._id as Types.ObjectId,
        provider: ProviderEnum.SYSTEM,
      },
      update: {
        $set: {
          password: await generateHash(password),
          ...update,
        },
        $push: { historyPassword: req.user?.password },
      },
    });

    if (!user) {
      throw new BadRequestException("In-valid Account");
    }

    return successResponse({ res, statusCode, data: { user } });
  };

  updateEmail = async (req: Request, res: Response): Promise<Response> => {
    const { newEmail }: IUpdateEmail = req.body;
    if (!req.user?.id) {
      throw new NotFoundRequestException("Invalid User");
    }

    const existEmail = await this.userModel.findOne({
      filter: { email: newEmail },
    });
    if (existEmail) {
      throw new BadRequestException("Email already in use");
    }
    const otp = generateOtp();
    const hashedOtp = await generateHash(String(otp));
    const user = await this.userModel.findOneAndUpdate({
      filter: {
        _id: req.user?._id as Types.ObjectId,
        provider: ProviderEnum.SYSTEM,
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
      throw new BadRequestException("Failed to update email");
    }
    emailEvent.emit("confirmEmail", { to: newEmail, otp });
    return successResponse({ res });
  };

  confirmPendingEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { pendingEmail, otp }: IConfirmPendingEmail = req.body;

    const user = await this.userModel.findOne({
      filter: {
        pendingEmail,
        confirmEmailOtp: { $exists: true },
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid account");
    }

    if (!(await compareHash(String(otp), user.confirmEmailOtp as string))) {
      throw new conflictException("Invalid Confirm");
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

    return successResponse({ res, message: "Email confirmed successfully" });
  };

  sendFriendRequest = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    const checkFriendRequestExist = await this.friendRequestModel.findOne({
      filter: {
        createdBy: { $in: [req.user?._id, userId] },
        sendTo: { $in: [req.user?._id, userId] },
      },
    });
    if (checkFriendRequestExist) {
      throw new conflictException("friend request already sent");
    }
    const user = await this.userModel.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new NotFoundRequestException("invalid recipient");
    }
    const [friendRequest] =
      (await this.friendRequestModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            sendTo: userId,
          },
        ],
      })) || [];

    if (!friendRequest) {
      throw new BadRequestException("something went wrong");
    }

    return successResponse({
      res,
      statusCode: 201,
    });
  };

  acceptFriendRequest = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { requestId } = req.params as unknown as {
      requestId: Types.ObjectId;
    };
    console.log("requestId", requestId);

    const friendRequest = await this.friendRequestModel.findOneAndUpdate({
      filter: {
        _id: requestId,
        acceptedAt: { $exists: false },
        sendTo: req.user?._id,
      },
      update: {
        acceptedAt: new Date(),
      },
    });

    if (!friendRequest) {
      throw new NotFoundRequestException("fail to find matching result");
    }

    const { createdBy, sendTo } = friendRequest;

    await Promise.all([
      this.userModel.updateOne({
        filter: { _id: createdBy },
        update: { $addToSet: { friends: sendTo } },
      }),

      this.userModel.updateOne({
        filter: { _id: sendTo },
        update: { $addToSet: { friends: createdBy } },
      }),
    ]);

    return successResponse({ res });
  };
}
export default new UserService();
