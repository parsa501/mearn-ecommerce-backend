import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/ProductCn.js";

const productRouter = express.Router();

productRouter.route("/").post(create).get(getAll);
productRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default productRouter;
