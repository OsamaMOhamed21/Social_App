
import { IFriendRequest as TDocument } from "../model/friendRequest.model";
import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";

export class friendRequestRepository extends DatabaseRepository<TDocument> {
  constructor(protected override readonly model: Model<TDocument>) {
    super(model);
  }
}
