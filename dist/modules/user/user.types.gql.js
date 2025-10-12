"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allUsers = exports.Welcome = exports.sayHi = exports.GraphQLOneUserResponse = exports.GraphQlProviderEnum = exports.GraphQlRoleEnum = exports.GraphQlGenderEnum = void 0;
const graphql_1 = require("graphql");
const model_1 = require("../../DB/model");
exports.GraphQlGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GenderEnum",
    description: "User gender options",
    values: {
        male: { value: "male" },
        female: { value: "female" },
    },
});
exports.GraphQlRoleEnum = new graphql_1.GraphQLEnumType({
    name: "RoleEnum",
    description: "User Role options",
    values: {
        admin: { value: model_1.RoleEnum.admin },
        superAdmin: { value: model_1.RoleEnum.superAdmin },
        user: { value: model_1.RoleEnum.user },
    },
});
exports.GraphQlProviderEnum = new graphql_1.GraphQLEnumType({
    name: "ProviderEnum",
    description: "User Provider options",
    values: {
        GOOGLE: { value: model_1.ProviderEnum.GOOGLE },
        SYSTEM: { value: model_1.ProviderEnum.SYSTEM },
    },
});
exports.GraphQLOneUserResponse = new graphql_1.GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: graphql_1.GraphQLString },
        username: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        pendingEmail: { type: graphql_1.GraphQLString },
        confirmEmailOtp: { type: graphql_1.GraphQLString },
        confirmAt: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        historyPassword: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        resetPasswordOtp: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        gender: { type: exports.GraphQlGenderEnum },
        role: { type: exports.GraphQlRoleEnum },
        provider: { type: exports.GraphQlProviderEnum },
        profileImage: { type: graphql_1.GraphQLString },
        temProfileImage: { type: graphql_1.GraphQLString },
        coverImage: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        freezeAt: { type: graphql_1.GraphQLString },
        freezeBy: { type: graphql_1.GraphQLID },
        restoreAt: { type: graphql_1.GraphQLString },
        restoreBy: { type: graphql_1.GraphQLID },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.sayHi = new graphql_1.GraphQLNonNull(graphql_1.GraphQLString);
exports.Welcome = new graphql_1.GraphQLNonNull(graphql_1.GraphQLString);
exports.allUsers = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(exports.GraphQLOneUserResponse));
