"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDeleteAccount = exports.changeRole = exports.confirmPendingEmail = exports.updateEmail = exports.updatePassword = exports.updateBasicInfo = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const model_1 = require("../../DB/model");
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
exports.updatePassword = {
    query: zod_1.z.object({
        flag: zod_1.z.enum(token_security_1.LogoutEnum).default(token_security_1.LogoutEnum.only),
    }),
    body: zod_1.z
        .strictObject({
        password: validation_middleware_1.generalFields.password,
        oldPassword: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    })
        .refine((data) => data.confirmPassword === data.password, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
};
exports.updateEmail = {
    body: zod_1.z.strictObject({
        newEmail: validation_middleware_1.generalFields.email,
    }),
};
exports.confirmPendingEmail = {
    body: zod_1.z.strictObject({
        pendingEmail: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.changeRole = {
    params: zod_1.z.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.z.strictObject({
        role: zod_1.z.enum(model_1.RoleEnum),
    }),
};
exports.hardDeleteAccount = exports.restoreAccount;
