import { HPostDemount, LikeActionEnum } from "../../DB/model";
import { IAuthGraph } from "../graphql";
import { PostService } from "./post.service";

export class PostResolver {
  private postService: PostService = new PostService();
  constructor() {}

  allPosts = async (
    parent: unknown,
    args: { page: number; size: number },
    context: IAuthGraph
  ): Promise<{
    decsCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | undefined;
    result: HPostDemount[];
  }> => {
    return await this.postService.allPosts(args, context.user);
  };

  likePost = async (
    parent: unknown,
    args: { postId: string; action: LikeActionEnum },
    context: IAuthGraph
  ): Promise<HPostDemount> => {
    return await this.postService.likeGraphPost(args, context.user);
  };
}
