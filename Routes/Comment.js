import { Router } from "express";
import {
  create,
  getAll,
  getAllPostComments,
  changePublish,
} from "../Controllers/CommentCn.js";

const commentRouter = Router();

commentRouter.route("/").get(getAll).post(create);
commentRouter.route("/product/:id").get(getAllPostComments);
commentRouter.route("/:id/publish").patch(changePublish);

export default commentRouter;