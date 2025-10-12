import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGQLSchema } from "../user";
import { postGqlSchema } from "../post";

const query = new GraphQLObjectType({
  name: "RootQueryType",
  description: "Optional Text",
  fields: {
    ...userGQLSchema.registerQuery(),
    ...postGqlSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootSchemaMutation",
  description: "Hold All RootSchemaMutation Field",
  fields: {
    ...userGQLSchema.registerMutation(),
    ...postGqlSchema.registerMutation(),
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});
