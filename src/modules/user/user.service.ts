import type { Request, Response } from "express";

class UserService {
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return res.json({
      message: "Done",
      data: {
        user: req.user?._id,
        decoded: req.decoded?.iat,
      },
    });
  };
}
export default new UserService();
