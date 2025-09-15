import type { Request, Response } from "express";
import { UpdateQuery } from "mongoose";
import {
  HUserDocument,
  IUser,
  RoleEnum,
  UserModel,
} from "../../DB/model/user.model";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../utils/security/token.security";
import {
  IFreezeAccount,
  IHardDeleteAccount,
  ILogout,
  IRestoreAccount,
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
import { userRepository } from "../../DB/repository";

class UserService {
  private userModel = new userRepository(UserModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedException("Missing Details User");
    }
    return successResponse<IUserResponse>({
      res,
      data: {
        user: req.user,
      },
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
      },
    });
    if (!user) {
      throw new NotFoundRequestException("User Not Found");
    }
    return successResponse({ res });
  };
}
export default new UserService();
