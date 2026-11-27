import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
  checkDiscountCode,
} from "../Controllers/DiscountCn.js";

const discountRouter = Router();

discountRouter.route("/").post(create).get(getAll);
discountRouter.route("/check").post(checkDiscountCode);
discountRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default discountRouter;
