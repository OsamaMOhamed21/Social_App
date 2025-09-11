import { EventEmitter } from "node:events";
import { deleteFile, getFile } from "./s3.config";
import { userRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/model/user.model";
export const s3Event = new EventEmitter({});

s3Event.on("trackProfileImageUpload", (data) => {
  console.log("Received event:", data);

  setTimeout(async () => {
    const userModel = new userRepository(UserModel);

    try {
      await getFile({ Key: data.Key });

      await userModel.updateOne({
        filter: { _id: data.userId },
        update: {
          $unset: { temProfileImage: 1 },
        },
      });

      if (data.oldKey) {
        await deleteFile({ Key: data.oldKey });
      }

      console.log(`Profile image updated & old image deleted 🐧👌`);
    } catch (error: any) {
      console.error("Error while processing image:", error);

      if (error.Code === "NoSuchKey") {
        console.warn("New file not found, reverting to old profile image");

        await userModel.updateOne({
          filter: { _id: data.userId },
          update: {
            profileImage: data.oldKey,
            $unset: { temProfileImage: 1 },
          },
        });
      }
    }
  }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN) * 1000);
});
