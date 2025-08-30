"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const generateOtp = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateOtp = generateOtp;
