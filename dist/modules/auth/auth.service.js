"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/model/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const hash_security_1 = require("../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("fail to verify this google account");
        }
        return payload;
    }
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.GOOGLE,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Not Register Account Or Registered With Another Provider");
        }
        const Credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.status(201).json({ message: "Done", Credentials });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
            },
        });
        if (user) {
            if (user.provider === user_model_1.ProviderEnum.GOOGLE) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.conflictException(`Email exists with another provider ::: ${user.provider}`);
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    lastName: family_name,
                    profileImage: picture,
                    confirmAt: new Date(),
                },
            ],
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequestException("Fail To Signup With Gmail Please Try Again Later");
        }
        const Credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return res.status(201).json({ message: "Done", Credentials });
    };
    signup = async (req, res) => {
        const { username, email, password } = req.body;
        console.log({ username, email, password });
        const CheckEmailExits = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: true,
            },
        });
        console.log({ CheckEmailExits });
        if (CheckEmailExits) {
            throw new error_response_1.conflictException("email exits");
        }
        const otp = (0, otp_1.generateOtp)();
        const user = await this.userModel.createUser({
            data: [
                {
                    username,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)),
                },
            ],
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp });
        return res.status(201).json({ message: "Done", data: { user } });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundRequestException("In-valid Login Data");
        }
        if (!user.confirmAt) {
            throw new error_response_1.BadRequestException("Verify your account first");
        }
        if (!(await (0, hash_security_1.compareHash)(password, user.password))) {
            throw new error_response_1.NotFoundRequestException("In-valid Login Data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({
            message: "Done",
            data: { credentials },
        });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmAt: { $exists: false },
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Invalid account");
        }
        if (!(0, hash_security_1.compareHash)(otp, user.confirmEmailOtp)) {
            throw new error_response_1.conflictException("invalid Confirm");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmAt: new Date(),
                $unset: { confirmEmailOtp: 1 },
            },
        });
        return res.json({ message: "Done" });
    };
    sendForgotCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.SYSTEM,
                confirmAt: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundRequestException("Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account]");
        }
        const otp = (0, otp_1.generateOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp)),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail To Send The Reset Code Please Try Again Later");
        }
        email_event_1.emailEvent.emit("resetPassword", { to: email, otp });
        return res.json({ message: "Done" });
    };
    verifyPasswordCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundRequestException("Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account , Missing ResetPasswordOtp]");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.conflictException("Invalid Otp");
        }
        return res.json({ message: "Done" });
    };
    resetVerifyPassword = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundRequestException("Invalid Account Due To One Of The Following [Not Register , Invalid Provider , Not Confirmed Account , Missing ResetPasswordOtp]");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.conflictException("Invalid Otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail To Reset Account Password");
        }
        return res.json({ message: "Done", data: { result } });
    };
}
exports.default = new AuthenticationService();
