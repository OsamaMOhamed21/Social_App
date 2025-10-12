import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { GraphQLUniformResponse } from "../graphql/types.gql";
import { ProviderEnum, RoleEnum } from "../../DB/model";

export const GraphQlGenderEnum = new GraphQLEnumType({
  name: "GenderEnum",
  description: "User gender options",
  values: {
    male: { value: "male" },
    female: { value: "female" },
  },
});

export const GraphQlRoleEnum = new GraphQLEnumType({
  name: "RoleEnum",
  description: "User Role options",
  values: {
    admin: { value: RoleEnum.admin },
    superAdmin: { value: RoleEnum.superAdmin },
    user: { value: RoleEnum.user },
  },
});

export const GraphQlProviderEnum = new GraphQLEnumType({
  name: "ProviderEnum",
  description: "User Provider options",
  values: {
    GOOGLE: { value: ProviderEnum.GOOGLE },
    SYSTEM: { value: ProviderEnum.SYSTEM },
  },
});

export const GraphQLOneUserResponse = new GraphQLObjectType({
  name: "OneUserResponse",
  fields: {
    _id: { type: GraphQLID },

    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: GraphQLString },
    username: { type: GraphQLString },
    slug: { type: GraphQLString },

    email: { type: new GraphQLNonNull(GraphQLString) },
    pendingEmail: { type: GraphQLString },
    confirmEmailOtp: { type: GraphQLString },
    confirmAt: { type: GraphQLString },

    password: { type: GraphQLString },
    historyPassword: { type: new GraphQLList(GraphQLString) },
    resetPasswordOtp: { type: GraphQLString },
    changeCredentialsTime: { type: GraphQLString },

    phone: { type: GraphQLString },
    address: { type: GraphQLString },

    gender: { type: GraphQlGenderEnum },
    role: { type: GraphQlRoleEnum },
    provider: { type: GraphQlProviderEnum },
    profileImage: { type: GraphQLString },
    temProfileImage: { type: GraphQLString },
    coverImage: { type: new GraphQLList(GraphQLString) },

    freezeAt: { type: GraphQLString },
    freezeBy: { type: GraphQLID },

    restoreAt: { type: GraphQLString },
    restoreBy: { type: GraphQLID },
    friends: { type: new GraphQLList(GraphQLID) },

    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});

export const sayHi = new GraphQLNonNull(GraphQLString);
export const Welcome = new GraphQLNonNull(GraphQLString);
export const allUsers = new GraphQLNonNull(
  new GraphQLList(GraphQLOneUserResponse)
);
