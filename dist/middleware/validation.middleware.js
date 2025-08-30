"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const zod_1 = require("zod");
const error_response_1 = require("../utils/response/error.response");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationError.push({
                    key,
                    issues: errors.issues.map((issues) => {
                        return { message: issues.message, path: issues.path[0] };
                    }),
                });
            }
        }
        if (validationError.length) {
            throw new error_response_1.BadRequestException("validation Error", validationError);
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.z.string().min(2).max(20),
    email: zod_1.z.email(),
    password: zod_1.z
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,16}$/),
    confirmPassword: zod_1.z.string(),
    otp: zod_1.z.string().regex(/^\d{6}$/),
};
