"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLUniformResponse = void 0;
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const modules_1 = require("./modules");
const error_response_1 = require("./utils/response/error.response");
const connections_db_1 = __importDefault(require("./DB/connections.db"));
const s3_config_1 = require("./utils/multer/s3.config");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
const GraphQLUniformResponse = ({ name, data, }) => {
    return new graphql_1.GraphQLObjectType({
        name,
        fields: {
            message: { type: graphql_1.GraphQLString },
            statusCode: { type: graphql_1.GraphQLInt },
            data: { type: data },
        },
    });
};
exports.GraphQLUniformResponse = GraphQLUniformResponse;
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "Too Many Request please try again later" },
    statusCode: 429,
});
const bootStrap = async () => {
    const port = process.env.PORT || 5000;
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)(), limiter);
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "RootQueryType",
            description: "Optional Text",
            fields: {
                sayHi: {
                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                    description: "This Felid Return Our Server Welcome Message",
                    resolve: (parent, args) => {
                        return "Hello GraphQL 🚀";
                    },
                },
            },
        }),
    });
    app.all("/graphql", (0, express_2.createHandler)({
        schema,
    }));
    app.get("/", (req, res) => {
        res.status(200).json({
            message: `Welcome to ${process.env.APPLICATION_NAME} BackEnd landing page ❤️`,
        });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.get("/upload/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        console.log(s3Response.Body);
        if (!s3Response) {
            throw new error_response_1.BadRequestException("Fail To Fetch This Asset");
        }
        res.setHeader("Content-Type", `${s3Response.ContentType}` || "application/octet-stream");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split("/").pop()}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedLink)({
            Key,
            downloadName: downloadName,
            download,
        });
        return res.json({ message: "Done", data: { url } });
    });
    app.use("{/*dummy}", (req, res) => {
        return res.status(404).json({ message: "invalid Routing ❌" });
    });
    app.use(error_response_1.globalErrorHandling);
    await (0, connections_db_1.default)();
    const httpServer = app.listen(port, () => {
        console.log(`server is running on port ::: ${port} 👌`);
    });
};
exports.default = bootStrap;
