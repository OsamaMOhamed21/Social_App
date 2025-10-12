import { GenderEnum, HUserDocument } from "../../DB/model";
import { graphAuthorization } from "../../middleware/authentication.middleware";
import { graphValidation } from "../../middleware/validation.middleware";
import { IAuthGraph } from "../graphql";
import { endPoint } from "./user.authorization";
import { UserService } from "./user.service";
import * as validator from "./user.validation";

export class UserResolver {
  private userService: UserService = new UserService();
  constructor() {}

  sayHi = async (
    parent: unknown,
    args: { name: string },
    context: IAuthGraph
  ): Promise<string> => {
    await graphValidation<{ name: string }>(validator.sayHi, args);
    await graphAuthorization(endPoint.sayHi, context.user.role);
    return this.userService.sayHi(context.user);
  };

  welcome = async (
    parent: unknown,
    args: { name: string },
    context: IAuthGraph
  ): Promise<string> => {
    await graphValidation<{ name: string }>(validator.welcome, args);
    await graphAuthorization(endPoint.Welcome, context.user.role);
    return this.userService.welcome(context.user);
  };

  allUsers = async (
    parent: unknown,
    args: { gender: GenderEnum },
    context: IAuthGraph
  ): Promise<HUserDocument[]> => {
    console.log({ context });

    return await this.userService.allUsers(args, context.user);
  };
}
