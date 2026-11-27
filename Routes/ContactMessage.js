
import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/ContactMessageCn.js";

const contactMessageRouter = Router();

contactMessageRouter.route("/").get(getAll).post(create);
contactMessageRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default contactMessageRouter;
