
import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/NotificationCn.js";

const notificationRouter = Router();

notificationRouter.route("/").get(getAll).post(create);
notificationRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default notificationRouter;
