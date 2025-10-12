import { RoleEnum } from "../../DB/model/user.model";


export const endPoint = {
  sayHi: [RoleEnum.user, RoleEnum.admin, RoleEnum.superAdmin],
  Welcome: [RoleEnum.user, RoleEnum.admin, RoleEnum.superAdmin],
  profile: [RoleEnum.user, RoleEnum.admin],
  restoreAccount: [RoleEnum.admin],
  hardDeleteAccount: [RoleEnum.admin],
  dashboard: [RoleEnum.admin, RoleEnum.superAdmin],
};
