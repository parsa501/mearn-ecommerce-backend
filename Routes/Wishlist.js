import { Router } from "express";
import {
  getOne,
  addProduct,
  removeProduct,
  clear,
} from "../Controllers/WishlistCn.js";

const wishlistRouter = Router();

wishlistRouter.route("/").get(getOne).post(addProduct).delete(removeProduct);

wishlistRouter.route("/clear").delete(clear);

export default wishlistRouter;
