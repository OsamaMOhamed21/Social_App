"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/model/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        const { username, email, password } = req.body;
        console.log({ username, email, password });
        const CheckEmailExits = await this.userModel.findOne({
            filter: { email },
        });
        console.log({ CheckEmailExits });
        if (CheckEmailExits) {
            throw new error_response_1.configException("email exits");
        }
        const user = await this.userModel.createUser({
            data: [{ username, email, password }],
        });
        return res.status(201).json({ message: "Done", data: { user } });
    };
    login = (req, res) => {
        return res.json({ message: "Done", data: req.body });
    };
}
exports.default = new AuthenticationService();
