
import { Router } from "express";
import {
  getOne,
  addProduct,
  removeProduct,
  clear,
} from "../Controllers/CompareListCn.js";

const compareListRouter = Router();

compareListRouter.route("/")
  .get(getOne)
  .post(addProduct)
  .delete(removeProduct);

compareListRouter.route("/clear").delete(clear);

export default compareListRouter;
