"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodedToken = exports.createLoginCredentials = exports.getSignature = exports.detectSignature = exports.VerifyToken = exports.generateToken = exports.TokenEnum = exports.signatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = require("../../DB/model/user.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
var signatureLevelEnum;
(function (signatureLevelEnum) {
    signatureLevelEnum["bearer"] = "Bearer";
    signatureLevelEnum["system"] = "System";
})(signatureLevelEnum || (exports.signatureLevelEnum = signatureLevelEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["access"] = "access";
    TokenEnum["refresh"] = "refresh";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = {
    expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
}, }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const VerifyToken = async ({ token, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, }) => {
    return (0, jsonwebtoken_1.verify)(token, secret);
};
exports.VerifyToken = VerifyToken;
const detectSignature = async (role = user_model_1.RoleEnum.user) => {
    let signatureLevel = signatureLevelEnum.bearer;
    switch (role) {
        case user_model_1.RoleEnum.admin:
            signatureLevel = signatureLevelEnum.system;
            break;
        default:
            signatureLevel = signatureLevelEnum.bearer;
            break;
    }
    return signatureLevel;
};
exports.detectSignature = detectSignature;
const getSignature = async (signatureLevel = signatureLevelEnum.bearer) => {
    let signatures = {
        access_signature: "",
        refresh_signature: "",
    };
    switch (signatureLevel) {
        case signatureLevelEnum.system:
            signatures.access_signature = process.env
                .ACCESS_SYSTEM_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_SYSTEM_TOKEN_SIGNATURE;
            break;
        default:
            signatures.access_signature = process.env
                .ACCESS_USER_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_USER_TOKEN_SIGNATURE;
            break;
    }
    return signatures;
};
exports.getSignature = getSignature;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignature)(user.role);
    const signatures = await (0, exports.getSignature)(signatureLevel);
    console.log(signatures);
    const access_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) },
    });
    const refresh_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_signature,
        options: {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        },
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodedToken = async ({ authorization, tokenType = TokenEnum.access, }) => {
    const userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    const [bearerKey, token] = authorization.split(" ");
    if (!bearerKey || !token) {
        throw new error_response_1.UnauthorizedException("Missing Token Parts");
    }
    const signatures = await (0, exports.getSignature)(bearerKey);
    const decoded = await (0, exports.VerifyToken)({
        token,
        secret: tokenType === TokenEnum.refresh
            ? signatures.refresh_signature
            : signatures.access_signature,
    });
    if (!decoded._id || !decoded.iat) {
        throw new error_response_1.BadRequestException("Invalid Token Payload");
    }
    const user = await userModel.findOne({ filter: { _id: decoded._id } });
    if (!user) {
        throw new error_response_1.BadRequestException("Not Register Account");
    }
    return { user, decoded };
};
exports.decodedToken = decodedToken;
