import * as gqlTypes from "./user.types.gql";
import * as gqlArgs from "./user.args.gql";
import { UserResolver } from "./user.resolver";
import { GraphQLNonNull, GraphQLString } from "graphql";

class UserGQLSchema {
  private userResolver: UserResolver = new UserResolver();
  constructor() {}

  registerQuery = () => {
    return {
      sayHi: {
        type: gqlTypes.sayHi,
        args: { name: { type: new GraphQLNonNull(GraphQLString) } },
        description: "This Felid Return Our Server Welcome Message",
        resolve: this.userResolver.sayHi,
      },

      allUsers: {
        type: gqlTypes.allUsers,
        args: gqlArgs.allUsers,
        resolve: this.userResolver.allUsers,
      },
    };
  };

  registerMutation = () => {
    return {
      Welcome: {
        type: gqlTypes.Welcome,
        args: { name: { type: new GraphQLNonNull(GraphQLString) } },
        description: "This Felid Return Our Server Welcome Message",
        resolve: this.userResolver.sayHi,
      },
    };
  };
}

export default new UserGQLSchema();
