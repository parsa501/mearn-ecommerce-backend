import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/ProductVariantCn.js";

const productVariantRouter = express.Router();

productVariantRouter.route("/").post(create).get(getAll);
productVariantRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default productVariantRouter;
