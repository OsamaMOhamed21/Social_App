//? setup ENV
import { config } from "dotenv";
import {resolve} from "node:path"
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
import authController from "./modules/auth/auth.controller";
import { globalErrorHandling } from "./utils/response/error.response";
import connectDB from "./DB/connections.db";

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
  app.use("/auth", authController);

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
