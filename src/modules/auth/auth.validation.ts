import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";

export const login = {
  body: z.strictObject({
    email: generalFields.email,
    password: generalFields.password,
  }),
};

export const signup = {
  body: login.body
    .extend({
      username: generalFields.username,
      email: generalFields.email,
      password: generalFields.password,
      confirmPassword: generalFields.confirmPassword,
    })
    .superRefine((data, ctx) => {
      if (data.confirmPassword !== data.password) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Password missMatch conformPassword",
        });
      }
      if (data.username?.split(" ").length != 2) {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: "username must consist of 2 parts like ex: OSAMA MOHAMED",
        });
      }
    }),
};

export const confirmEmail = {
  body: z.strictObject({
    email: generalFields.email,
    otp: generalFields.otp,
  }),
};

export const signupWithGmail = {
  body: z.strictObject({
    idToken: generalFields.idToken,
  }),
};

export const sendForgotPasswordCode = {
  body: z.strictObject({
    email: generalFields.email,
  }),
};

export const verifyPasswordCode = {
  body: sendForgotPasswordCode.body.extend({
    otp: generalFields.otp,
  }),
};

export const resetVerifyPassword = {
  body: verifyPasswordCode.body
    .extend({
      otp: generalFields.otp,
      password: generalFields.password,
      confirmPassword: generalFields.confirmPassword,
    })
    .refine(
      (data) => {
        return data.password === data.confirmPassword;
      },
      { message: "Password Mis Match Confirm Password" }
    ),
};
