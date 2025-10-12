import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { AllowCommentEnum, AvailabilityEnum } from "../../DB/model";

export const GraphQlAvailabilityEnum = new GraphQLEnumType({
  name: "AvailabilityEnum",
  description: "User Availability options",
  values: {
    friends: { value: AvailabilityEnum.friends },
    onlyMe: { value: AvailabilityEnum.onlyMe },
    public: { value: AvailabilityEnum.public },
  },
});

export const GraphQlAllowCommentEnum = new GraphQLEnumType({
  name: "AllowCommentEnum",
  description: "User AllowComment options",
  values: {
    allow: { value: AllowCommentEnum.allow },
    deny: { value: AllowCommentEnum.deny },
  },
});

export const GraphQLOnePostResponse = new GraphQLObjectType({
  name: "OnePostResponse",
  fields: {
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    assetsFolderId: { type: GraphQLString },

    availability: { type: GraphQlAvailabilityEnum },
    allowComment: { type: GraphQlAllowCommentEnum },

    tags: { type: new GraphQLList(GraphQLID) },
    likes: { type: new GraphQLList(GraphQLID) },

    createdBy: { type: GraphQLID },

    freezedAt: { type: GraphQLString },
    freezedBy: { type: GraphQLID },

    restoreAt: { type: GraphQLString },
    restoreBy: { type: GraphQLID },

    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});

export const allPosts = new GraphQLObjectType({
  name:"allPosts",
  fields:{
      decsCount: {type:GraphQLInt},
      limit: {type:GraphQLInt},
      pages: {type:GraphQLInt},
      currentPage: {type:GraphQLInt},
      result: {type: new GraphQLList(GraphQLOnePostResponse)},
    }
});
