import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/CategoryCn.js";

const categoryRouter = express.Router();

categoryRouter.route("/").post(create).get(getAll);
categoryRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default categoryRouter;
