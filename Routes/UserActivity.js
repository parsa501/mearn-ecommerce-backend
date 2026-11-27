
import { Router } from "express";
import {
  getAll,
  getOne,
} from "../Controllers/UserActivityCn.js";

const userActivityRouter = Router();

userActivityRouter.route("/").get(getAll);
userActivityRouter.route("/:id").get(getOne);

export default userActivityRouter;
