import { v4 as uuid } from "uuid";
import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { sign, verify } from "jsonwebtoken";
import {
  type HUserDocument,
  RoleEnum,
  UserModel,
} from "../../DB/model/user.model";
import {
  BadRequestException,
  UnauthorizedException,
} from "../response/error.response";
import { userRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { HTokenDocument, TokenModel } from "../../DB/model/token.model";

export enum signatureLevelEnum {
  bearer = "Bearer",
  system = "System",
}

export enum TokenEnum {
  access = "access",
  refresh = "refresh",
}

export enum LogoutEnum {
  only = "only",
  all = "all",
}

export const generateToken = async ({
  payload,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  options = {
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  } as SignOptions,
}: {
  payload: object;
  secret?: Secret;
  options?: SignOptions;
}): Promise<string> => {
  return sign(payload, secret, options);
};

export const VerifyToken = async ({
  token,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
}: {
  token: string;
  secret?: Secret;
}): Promise<JwtPayload> => {
  return verify(token, secret) as JwtPayload;
};

export const detectSignature = async (
  role: RoleEnum = RoleEnum.user
): Promise<signatureLevelEnum> => {
  let signatureLevel: signatureLevelEnum = signatureLevelEnum.bearer;
  switch (role) {
    case RoleEnum.admin:
      signatureLevel = signatureLevelEnum.system;
      break;
    default:
      signatureLevel = signatureLevelEnum.bearer;
      break;
  }
  return signatureLevel;
};

export const getSignature = async (
  signatureLevel: signatureLevelEnum = signatureLevelEnum.bearer
): Promise<{ access_signature: string; refresh_signature: string }> => {
  let signatures: { access_signature: string; refresh_signature: string } = {
    access_signature: "",
    refresh_signature: "",
  };
  switch (signatureLevel) {
    case signatureLevelEnum.system:
      signatures.access_signature = process.env
        .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
      break;
    default:
      signatures.access_signature = process.env
        .ACCESS_USER_TOKEN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_USER_TOKEN_SIGNATURE as string;
      break;
  }
  return signatures;
};

export const createLoginCredentials = async (
  user: HUserDocument
): Promise<{ access_token: string; refresh_token: string }> => {
  const signatureLevel = await detectSignature(user.role);
  const signatures = await getSignature(signatureLevel);
  console.log(signatures);

  const jwtid = uuid();
  const access_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.access_signature,
    options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN), jwtid },
  });

  const refresh_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.refresh_signature,
    options: {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      jwtid,
    },
  });
  return { access_token, refresh_token };
};

export const decodedToken = async ({
  authorization,
  tokenType = TokenEnum.access,
}: {
  authorization: string;
  tokenType?: TokenEnum;
}) => {
  const userModel = new userRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);
  const [bearerKey, token] = authorization.split(" ");
  if (!bearerKey || !token) {
    throw new UnauthorizedException("Missing Token Parts");
  }

  const signatures = await getSignature(bearerKey as signatureLevelEnum);
  const decoded = await VerifyToken({
    token,
    secret:
      tokenType === TokenEnum.refresh
        ? signatures.refresh_signature
        : signatures.access_signature,
  });

  if (!decoded._id || !decoded.iat) {
    throw new BadRequestException("Invalid Token Payload");
  }
  if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
    throw new UnauthorizedException("Invalid Or Old Login Credentials");
  }

  const user = await userModel.findOne({ filter: { _id: decoded._id } });
  if (!user) {
    throw new BadRequestException("Not Register Account");
  }

  if ((user.changeCredentialsTime?.getTime() || 0) > decoded.iat * 1000) {
    throw new UnauthorizedException("Invalid Or Old Login Credentials");
  }

  return { user, decoded };
};

export const createRevokeToken = async (
  decoded: JwtPayload
): Promise<HTokenDocument> => {
  const tokenModel = new TokenRepository(TokenModel);
  const [result] =
    (await tokenModel.create({
      data: [
        {
          jti: decoded.jti as string,
          expiresIn:
            (decoded.iat as number) +
            Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
          userId: decoded._id,
        },
      ],
    })) || [];
  if (!result) {
    throw new BadRequestException("Fail To Revoke This Token");
  }
  return result;
};
