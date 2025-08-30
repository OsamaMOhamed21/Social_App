import type { Request, Response } from "express";
import type { IConfirmEmail, ISignupDTO } from "./auth.dto";
import { UserModel } from "../../DB/model/user.model";
import { userRepository } from "../../DB/repository/user.repository";
import {
  BadRequestException,
  conflictException,
} from "../../utils/response/error.response";
import { emailEvent } from "../../utils/event/email.event";
import { generateOtp } from "../../utils/otp";
import { compareHash, generateHash } from "../../utils/security/hash.security";
class AuthenticationService {
  private userModel = new userRepository(UserModel);
  constructor() {}
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
    console.log({ username, email, password });

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

    const user = await this.userModel.createUser({
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
    return res.status(201).json({ message: "Done", data: { user } });
  };

  login = (req: Request, res: Response): Response => {
    return res.json({ message: "Done", data: req.body });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IConfirmEmail = req.body;

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
    return res.json({ message: "Done" });
  };
}
export default new AuthenticationService();
