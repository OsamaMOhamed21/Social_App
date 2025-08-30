import { CreateOptions, HydratedDocument, Model  } from "mongoose";
import { IUser } from "../model/user.model";
import { DatabaseRepository } from "./database.repository";
import { BadRequestException } from "../../utils/response/error.response";

export class userRepository extends DatabaseRepository<IUser> {
  constructor(protected override readonly model: Model<IUser>) {
    super(model);
  }


  async createUser({
    data,
    options,
  }: {
    data: Partial<IUser>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<IUser>> {
    const [user] = (await this.create({ data, options })) || [];
    if (!user) {
      throw new BadRequestException("Fail to create this user");
    }
    return user;
  }
}
