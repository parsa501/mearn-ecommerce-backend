
import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/FAQCn.js";

const faqRouter = Router();

faqRouter.route("/").get(getAll).post(create);
faqRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default faqRouter;
