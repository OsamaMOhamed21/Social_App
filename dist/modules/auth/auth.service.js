"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/model/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const hash_security_1 = require("../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    constructor() { }
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
        const Credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({
            message: "Done",
            data: { Credentials },
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
}
exports.default = new AuthenticationService();
