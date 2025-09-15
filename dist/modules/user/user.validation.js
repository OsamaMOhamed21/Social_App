"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDeleteAccount = exports.updateBasicInfo = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_security_1.LogoutEnum).default(token_security_1.LogoutEnum.only),
    }),
};
exports.freezeAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string().optional(),
    })
        .optional()
        .refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"],
    }),
};
exports.restoreAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string(),
    })
        .refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"],
    }),
};
exports.updateBasicInfo = {
    body: zod_1.z
        .strictObject({
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
    })
        .refine((data) => {
        return data.firstName && data.lastName && data.phone;
    }, { error: "Invalid Data" }),
};
exports.hardDeleteAccount = exports.restoreAccount;
