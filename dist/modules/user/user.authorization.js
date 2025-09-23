"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const user_model_1 = require("../../DB/model/user.model");
exports.endPoint = {
    profile: [user_model_1.RoleEnum.user, user_model_1.RoleEnum.admin],
    restoreAccount: [user_model_1.RoleEnum.admin],
    hardDeleteAccount: [user_model_1.RoleEnum.admin],
    dashboard: [user_model_1.RoleEnum.admin, user_model_1.RoleEnum.superAdmin],
};
