import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;
type ValidationErrorType = Array<{
  key: KeyReqType;
  issues: Array<{
    message: string;
    path: string | number | symbol | undefined;
  }>;
}>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {
    const validationError: ValidationErrorType = [];
    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;

      const validationResult = schema[key].safeParse(req[key]);
      if (!validationResult.success) {
        const errors = validationResult.error as ZodError;
        validationError.push({
          key,
          issues: errors.issues.map((issues) => {
            return { message: issues.message, path: issues.path[0] };
          }),
        });
      }
    }

    if (validationError.length) {
      throw new BadRequestException("validation Error", validationError);
    }

    return next() as unknown as NextFunction;
  };
};

export const generalFields = {
  username: z.string().min(2).max(20),
  email: z.email(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,16}$/
    ),
  confirmPassword: z.string(),
  otp: z.string().regex(/^\d{6}$/),
  idToken: z.string(),
};
