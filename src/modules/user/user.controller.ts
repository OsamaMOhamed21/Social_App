import { Router } from "express";
import userService from "./user.service";
import { authentication} from "../../middleware/authentication.middleware";
const router = Router();
router.get("/", authentication() ,userService.profile);
export default router;
