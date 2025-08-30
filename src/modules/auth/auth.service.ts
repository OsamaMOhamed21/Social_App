import type { Request, Response } from "express";
import type { ISignupDTO } from "./auth.dto";
import { UserModel } from "../../DB/model/user.model";
import { userRepository } from "../../DB/repository/user.repository";
import { configException } from "../../utils/response/error.response";
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
    });
    console.log({ CheckEmailExits });
    if (CheckEmailExits) {
      throw new configException("email exits");
    }

    const user = await this.userModel.createUser({
      data: [{ username, email, password }],
    });
    return res.status(201).json({ message: "Done", data: { user } });
  };

  login = (req: Request, res: Response): Response => {
    return res.json({ message: "Done", data: req.body });
  };
}
export default new AuthenticationService();
