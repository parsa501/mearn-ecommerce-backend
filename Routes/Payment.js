
import { Router } from "express";
import {
  getAll,
  getOne,
  getMyPayments,
} from "../Controllers/PaymentCn.js";

const paymentRouter = Router();

paymentRouter.route("/").get(getAll);
paymentRouter.route("/my").get(getMyPayments);
paymentRouter.route("/:id").get(getOne);

export default paymentRouter;
