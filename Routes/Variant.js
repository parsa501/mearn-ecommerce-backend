import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/VariantCn.js";

const variantRouter = express.Router();

variantRouter.route("/").post(create).get(getAll);

variantRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default variantRouter;