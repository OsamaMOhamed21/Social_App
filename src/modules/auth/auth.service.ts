import type { Request, Response } from "express";
import type {
  IConfirmEmailDTO,
  IForgotCodeDTO,
  IGmailDTO,
  ILoginDTO,
  IResetVerifyCodeDTO,
  ISignupDTO,
  IVerifyCodeDTO,
} from "./auth.dto";
import { ProviderEnum, UserModel } from "../../DB/model/user.model";
import { userRepository } from "../../DB/repository/user.repository";
import {
  BadRequestException,
  conflictException,
  NotFoundRequestException,
} from "../../utils/response/error.response";
import { emailEvent } from "../../utils/email/email.event";
import { generateOtp } from "../../utils/otp";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { createLoginCredentials } from "../../utils/security/token.security";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { successResponse } from "../../utils/response/success.response";
import { ILoginResponse } from "./auth.entities";

class AuthenticationService {
  private userModel = new userRepository(UserModel);
  constructor() {}

  private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("fail to verify this google account");
    }
    return payload;
  }

  loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGmailDTO = req.body;
    const { email } = await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.GOOGLE,
      },
    });

    if (!user) {
      throw new BadRequestException(
        "Not Register Account Or Registered With Another Provider"
      );
    }

    const credentials = await createLoginCredentials(user);

    return successResponse<ILoginResponse>({ res, data: { credentials } });
  };
  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGmailDTO = req.body;
    const { email, family_name, given_name, picture } =
      await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
      },
    });

    if (user) {
      if (user.provider === ProviderEnum.GOOGLE) {
        return await this.loginWithGmail(req, res);
      }
      throw new conflictException(
        `Email exists with another provider ::: ${user.provider}`
      );
    }

    const [newUser] =
      (await this.userModel.create({
        data: [
          {
            firstName: given_name as string,
            lastName: family_name as string,
            profileImage: picture as string,
            confirmAt: new Date(),
          },
        ],
      })) || [];

    if (!newUser) {
      throw new BadRequestException(
        "Fail To Signup With Gmail Please Try Again Later"
      );
    }

    const credentials = await createLoginCredentials(newUser);

    return successResponse<ILoginResponse>({
      res,
      statusCode: 201,
      data: { credentials },
    });
  };

  /**
   *
   * @param req - Express.Request
   * @param res - Express.Response
   * @returns Promise<Response>
   * @example({ username, email, password }: ISignupDTO)
   * return {message: Done , statusCode: 201}
   */
  signup = async (req: Request, res: Response): Promise<Response> => {
    const { username, email, password }: ISignupDTO = req.body;

    const CheckEmailExits = await this.userModel.findOne({
      filter: { email },
      select: "email",
      options: {
        lean: true,
      },
    });
    console.log({ CheckEmailExits });
    if (CheckEmailExits) {
      throw new conflictException("email exits");
    }

    const otp = generateOtp();

    await this.userModel.createUser({
      data: [
        {
          username,
          email,
          password: await generateHash(password),
          confirmEmailOtp: await generateHash(String(otp)),
        },
      ],
    });

    emailEvent.emit("confirmEmail", { to: email, otp });
    return successResponse({ res, statusCode: 201 });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginDTO = req.body;

    const user = await this.userModel.findOne({
      filter: { email },
    });
    if (!user) {
      throw new NotFoundRequestException("In-valid Login Data");
    }

    if (!user.confirmAt) {
      throw new BadRequestException("Verify your account first");
    }

    if (!(await compareHash(password, user.password))) {
      throw new NotFoundRequestException("In-valid Login Data");
    }

    const credentials = await createLoginCredentials(user);
    return successResponse<ILoginResponse>({ res, data: { credentials } });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IConfirmEmailDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmailOtp: { $exists: true },
        confirmAt: { $exists: false },
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid account");
    }

    if (!compareHash(otp, user.confirmEmailOtp as string)) {
      throw new conflictException("invalid Confirm");
    }

    await this.userModel.updateOne({
      filter: { email },
      update: {
        confirmAt: new Date(),
        $unset: { confirmEmailOtp: 1 },
      },
    });
    return successResponse({ res });
  };

  sendForgotCode = async (req: Request, res: Response): Promise<Response> => {
    const { email }: IForgotCodeDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmAt: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundRequestException(
        "Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account]"
      );
    }

    const otp = generateOtp();
    const result = await this.userModel.updateOne({
      filter: { email },
      update: {
        resetPasswordOtp: await generateHash(String(otp)),
      },
    });
    if (!result.matchedCount) {
      throw new BadRequestException(
        "Fail To Send The Reset Code Please Try Again Later"
      );
    }

    emailEvent.emit("resetPassword", { to: email, otp });
    return successResponse({ res });
  };

  verifyPasswordCode = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, otp }: IVerifyCodeDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundRequestException(
        "Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account , Missing ResetPasswordOtp]"
      );
    }

    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new conflictException("Invalid Otp");
    }

    return successResponse({ res });
  };

  resetVerifyPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, otp, password }: IResetVerifyCodeDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundRequestException(
        "Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account , Missing ResetPasswordOtp]"
      );
    }

    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new conflictException("Invalid Otp");
    }

    const result = await this.userModel.updateOne({
      filter: { email },
      update: {
        password: await generateHash(password),
        changeCredentialsTime: new Date(),
        $unset: { resetPasswordOtp: 1 },
      },
    });
    if (!result.matchedCount) {
      throw new BadRequestException("Fail To Reset Account Password");
    }

    return successResponse({ res, data: { result } });
  };
}
export default new AuthenticationService();
