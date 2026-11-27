import { Router } from "express";
import {
  getAll,
  getOne,
  update,
  payment,
  callBackPayment,
} from "../Controllers/OrderCn.js";

const orderRouter = Router();

orderRouter.route("/").get(getAll);

orderRouter.route("/payment").post(payment);

orderRouter.route("/zarinpal/callback").get(callBackPayment);

orderRouter.route("/:id").get(getOne).patch(update);

export default orderRouter;
