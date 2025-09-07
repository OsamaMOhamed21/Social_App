import type { Request, Response } from "express";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/model/user.model";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../utils/security/token.security";
import { userRepository } from "../../DB/repository/user.repository";
import { ILogout } from "./user.dto";
import { uploadFile } from "../../utils/multer/s3.config";
import { JwtPayload } from "jsonwebtoken";
import { StorageEnum } from "../../utils/multer/cloud.multer";

class UserService {
  private userModel = new userRepository(UserModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return res.json({
      message: "Done",
      data: {
        user: req.user?._id,
        decoded: req.decoded?.iat,
      },
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    const key = await uploadFile({
      storageApproach:StorageEnum.disk,
      file: req.file as Express.Multer.File,
      path: `users/${req.decoded?._id}`,
    });
    return res.json({
      message: "Done",
      data: {
        key,
      },
    });
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

    return res.status(statusCode).json({
      message: "Done",
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return res.status(201).json({ message: "Done", data: { credentials } });
  };
}
export default new UserService();
