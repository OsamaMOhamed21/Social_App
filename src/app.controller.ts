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
import { authRouter, postRouter, userRouter } from "./modules";

import {
  BadRequestException,
  globalErrorHandling,
} from "./utils/response/error.response";
import connectDB from "./DB/connections.db";
import { createGetPreSignedLink, getFile } from "./utils/multer/s3.config";

import { promisify } from "node:util";
import { pipeline } from "node:stream";

const createS3WriteStreamPipe = promisify(pipeline);

import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";

export const GraphQLUniformResponse = ({
  name,
  data,
}: {
  name: string;
  data: GraphQLOutputType;
}): GraphQLOutputType => {
  return new GraphQLObjectType({
    name,
    fields: {
      message: { type: GraphQLString },
      statusCode: { type: GraphQLInt },
      data: { type: data },
    },
  });
};

//* handel base rate limit on all api request
const limiter = rateLimit({
  windowMs: 60 * 60000,
  limit: 2000,
  message: { error: "Too Many Request please try again later" },
  statusCode: 429,
});

// const connectSockets = new Map<string, string>();
//* aoo-start-point
const bootStrap = async (): Promise<void> => {
  const port: number | string = process.env.PORT || 5000;
  const app: Express = express();

  //* global application middleware
  app.use(cors(), express.json(), helmet(), limiter);

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "RootQueryType",
      description: "Optional Text",
      fields: {
        sayHi: {
          type: new GraphQLNonNull(GraphQLString),
          description: "This Felid Return Our Server Welcome Message",
          resolve: (parent: unknown, args: any): string => {
            return "Hello GraphQL 🚀";
          },
        },
      },
    }),

  });

  app.all(
    "/graphql",
    createHandler({
      schema,
    })
  );
  //* app-router
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: `Welcome to ${process.env.APPLICATION_NAME} BackEnd landing page ❤️`,
    });
  });

  //* sub-app-routeing-modules
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);

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
  const httpServer = app.listen(port, () => {
    console.log(`server is running on port ::: ${port} 👌`);
  });

  // const io = new Server(httpServer, {
  //   cors: {
  //     origin: "*",
  //   },
  // });

  // io.use(async (socket: Socket, next) => {
  //   try {
  //     const { user, decoded } = await decodedToken({
  //       authorization: socket.handshake?.auth.authorization || "",
  //       tokenType: TokenEnum.access,
  //     });
  //     connectSockets.set(user._id.toString(), socket.id);
  //     next();
  //   } catch (error: any) {
  //     next(error);
  //   }
  // });
  // * listen to => http://localhost:3000/

  // io.on("connection", (socket: Socket) => {
  //   console.log(socket.id);
  //   // console.log({ connectSockets });

  //   socket.on("sayHi", (data, callback) => {
  //     console.log(data);
  //     callback("Hello From FE");
  //   });

  //   socket.on("disconnect", () => {
  //     console.log(`Logout From ::: ${socket.id}`);
  //   });
  // });

  // * listen to => http://localhost:3000/admin/

  // io.of("/admin").on("connection", (socket: Socket) => {
  //   console.log("Admin", socket.id);
  //   socket.on("disconnect", () => {
  //     console.log(`Logout From ::: ${socket.id}`);
  //   });
  // });
};
export default bootStrap;
