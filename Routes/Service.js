
import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/ServiceCn.js";

const serviceRouter = Router();

serviceRouter.route("/").get(getAll).post(create);
serviceRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default serviceRouter;
