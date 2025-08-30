import { compare, hash } from "bcrypt";

export const generateHash = async (
  plainText: string,
  saltRounds: number = Number(process.env.SALT) || 10
): Promise<string> => {
  return await hash(plainText, saltRounds);
};

export const compareHash = async (
  plainText: string,
  hash: string
): Promise<boolean> => {
  return await compare(plainText, hash);
};
