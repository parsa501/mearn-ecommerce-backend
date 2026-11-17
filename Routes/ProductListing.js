import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/ProductListingCn.js";

const productListingRouter = express.Router();

productListingRouter.route("/").post(create).get(getAll);
productListingRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default productListingRouter;