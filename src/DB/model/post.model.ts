import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum AllowCommentEnum {
  allow = "allow",
  deny = "deny",
}

export enum AvailabilityEnum {
  public = "public",
  friends = "friends",
  onlyMe = "onlyMe",
}

export enum LikeActionEnum {
  like = "like",
  unlike = "unlike",
}

export interface IPost {
  content?: string;
  attachments?: string[];
  assetsFolderId: string;

  availability: AvailabilityEnum;
  allowComment: AllowCommentEnum;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];

  createdBy: Types.ObjectId;

  freezedAt?: Date;
  freezedBy?: Types.ObjectId;

  restoreAt?: Date;
  restoreBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt?: Date;
}

export type HPostDemount = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 5000,
      required: function () {
        return !this.attachments?.length;
      },
    },
    attachments: [{ type: String }],
    assetsFolderId: { type: String, required: true },

    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },
    allowComment: {
      type: String,
      enum: AllowCommentEnum,
      default: AllowCommentEnum.allow,
    },

    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoreAt: Date,
    restoreBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const query = this.getQuery();

  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }

  next();
});

postSchema.pre(["findOne", "find", "countDocuments"], function (next) {
  const query = this.getQuery();

  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }

  next();
});

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
});

export const PostModel = models.Post || model<IPost>("Post", postSchema);
