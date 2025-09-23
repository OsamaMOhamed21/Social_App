import { RoleEnum } from "../../DB/model/user.model";

export const endPoint = {
  profile: [RoleEnum.user, RoleEnum.admin],
  restoreAccount: [RoleEnum.admin],
  hardDeleteAccount: [RoleEnum.admin],
  dashboard: [RoleEnum.admin, RoleEnum.superAdmin],
};
