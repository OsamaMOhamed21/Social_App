import {
  GraphQLObjectType,
  GraphQLSchema,
} from "graphql";
import { userGQLSchema } from "../user";

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    description: "Optional Text",
    fields: {
      ...userGQLSchema.registerQuery(),
    },
  }),
});
