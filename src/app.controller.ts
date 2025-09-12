//? setup ENV
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve("./config/.env.development") });
// config({});

//? load express and type express
import type { Express, Request, Response } from "express";
import express from "express";

//? third party middleware
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

//? import module routing
import { authRouter, userRouter } from "./modules";

import {
  BadRequestException,
  globalErrorHandling,
} from "./utils/response/error.response";
import connectDB from "./DB/connections.db";
import { createGetPreSignedLink, getFile } from "./utils/multer/s3.config";

import { promisify } from "node:util";
import { pipeline } from "node:stream";

const createS3WriteStreamPipe = promisify(pipeline);

//* handel base rate limit on all api request
const limiter = rateLimit({
  windowMs: 60 * 60000,
  limit: 2000,
  message: { error: "Too Many Request please try again later" },
  statusCode: 429,
});

//* aoo-start-point
const bootStrap = async (): Promise<void> => {
  const port: number | string = process.env.PORT || 5000;
  const app: Express = express();

  //* global application middleware
  app.use(cors(), express.json(), helmet(), limiter);

  //* app-router
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: `Welcome to ${process.env.APPLICATION_NAME} BackEnd landing page ❤️`,
    });
  });

  //* sub-app-routeing-modules
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  //* get assets
  app.get(
    "/upload/*path",
    async (req: Request, res: Response): Promise<void> => {
      const { downloadName, download = "false" } = req.query as {
        downloadName?: string;
        download?: string;
      };

      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const s3Response = await getFile({ Key });
      console.log(s3Response.Body);
      if (!s3Response) {
        throw new BadRequestException("Fail To Fetch This Asset");
      }

      res.setHeader(
        "Content-Type",
        `${s3Response.ContentType}` || "application/octet-stream"
      );

      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${downloadName || Key.split("/").pop()}"`
        );
      }
      return await createS3WriteStreamPipe(
        s3Response.Body as NodeJS.ReadableStream,
        res
      );
    }
  );

  app.get(
    "/upload/pre-signed/*path",
    async (req: Request, res: Response): Promise<Response> => {
      const { downloadName, download = "false" } = req.query as {
        downloadName?: string;
        download?: string;
      };

      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const url = await createGetPreSignedLink({
        Key,
        downloadName: downloadName as string,
        download,
      });
      return res.json({ message: "Done", data: { url } });
    }
  );
  //* in-valid-routing
  app.use("{/*dummy}", (req: Request, res: Response) => {
    return res.status(404).json({ message: "invalid Routing ❌" });
  });

  //* global -error -handling
  app.use(globalErrorHandling);

  // * DB
  await connectDB();

  // * Start Server
  app.listen(port, () => {
    console.log(`server is running on port ::: ${port} 👌`);
  });
};
export default bootStrap;
