import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/BrandCn.js";

const brandRouter = express.Router();

brandRouter.route("/").post(create).get(getAll);
brandRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default brandRouter;