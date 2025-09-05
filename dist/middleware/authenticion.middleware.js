"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const error_response_1 = require("../utils/response/error.response");
const token_security_1 = require("../utils/security/token.security");
const authentication = () => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation Error", {
                key: "headers",
                issues: [{ path: "authorization", message: "Missing Authorization " }],
            });
        }
        const { decoded, user } = await (0, token_security_1.decodedToken)({
            authorization: req.headers.authorization,
        });
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authentication = authentication;
