"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQLOnePostResponse = exports.GraphQlAllowCommentEnum = exports.GraphQlAvailabilityEnum = void 0;
const graphql_1 = require("graphql");
const model_1 = require("../../DB/model");
exports.GraphQlAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: "AvailabilityEnum",
    description: "User Availability options",
    values: {
        friends: { value: model_1.AvailabilityEnum.friends },
        onlyMe: { value: model_1.AvailabilityEnum.onlyMe },
        public: { value: model_1.AvailabilityEnum.public },
    },
});
exports.GraphQlAllowCommentEnum = new graphql_1.GraphQLEnumType({
    name: "AllowCommentEnum",
    description: "User AllowComment options",
    values: {
        allow: { value: model_1.AllowCommentEnum.allow },
        deny: { value: model_1.AllowCommentEnum.deny },
    },
});
exports.GraphQLOnePostResponse = new graphql_1.GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        assetsFolderId: { type: graphql_1.GraphQLString },
        availability: { type: exports.GraphQlAvailabilityEnum },
        allowComment: { type: exports.GraphQlAllowCommentEnum },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdBy: { type: graphql_1.GraphQLID },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoreAt: { type: graphql_1.GraphQLString },
        restoreBy: { type: graphql_1.GraphQLID },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    },
});
exports.allPosts = new graphql_1.GraphQLObjectType({
    name: "allPosts",
    fields: {
        decsCount: { type: graphql_1.GraphQLInt },
        limit: { type: graphql_1.GraphQLInt },
        pages: { type: graphql_1.GraphQLInt },
        currentPage: { type: graphql_1.GraphQLInt },
        result: { type: new graphql_1.GraphQLList(exports.GraphQLOnePostResponse) },
    }
});
