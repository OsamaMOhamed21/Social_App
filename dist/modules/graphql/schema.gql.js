"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const user_1 = require("../user");
exports.schema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "RootQueryType",
        description: "Optional Text",
        fields: {
            ...user_1.userGQLSchema.registerQuery(),
        },
    }),
});
