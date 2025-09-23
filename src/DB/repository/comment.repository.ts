import { IComment as TDocument } from "../model/comment.model";
import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";

export class CommentRepository extends DatabaseRepository<TDocument> {
  constructor(protected override readonly model: Model<TDocument>) {
    super(model);
  }
}
