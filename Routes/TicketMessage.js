
import { Router } from "express";
import {
  create,
  getAll,
} from "../Controllers/TicketMessageCn.js";

const ticketMessageRouter = Router();

ticketMessageRouter
  .route("/ticket/:ticketId")
  .get(getAll)
  .post(create);

export default ticketMessageRouter;
