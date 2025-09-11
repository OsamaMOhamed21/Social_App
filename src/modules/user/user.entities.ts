import { HUserDocument } from "../../DB/model/user.model";

export interface IRefreshTokenResponse {
  credentials: {
    access_token: string;
    refresh_token: string;
  };
}

export interface IProfileImageResponse {
  url: string;
}

export interface IUserResponse {
  user: Partial<HUserDocument>;
}
