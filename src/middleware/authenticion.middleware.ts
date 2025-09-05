import type { JwtPayload } from "jsonwebtoken";
import type { HUserDocument } from "../DB/model/user.model";
import type { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../utils/response/error.response";
import { decodedToken } from "../utils/security/token.security";

interface IAuthReq extends Request {
  user: HUserDocument;
  decoded: JwtPayload;
}

export const authentication = () => {
  return async (req: IAuthReq, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new BadRequestException("Validation Error", {
        key: "headers",
        issues: [{ path: "authorization", message: "Missing Authorization " }],
      });
    }
    const { decoded, user } = await decodedToken({
      authorization: req.headers.authorization,
    });
    req.user = user;
    req.decoded = decoded;
    next();
  };
};
