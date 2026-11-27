
import { Router } from "express";
import {
  getAll,
  getOne,
  update,
  getMyShipments,
} from "../Controllers/ShipmentCn.js";

const shipmentRouter = Router();

shipmentRouter.route("/").get(getAll);
shipmentRouter.route("/my").get(getMyShipments);
shipmentRouter.route("/:id").get(getOne).patch(update);

export default shipmentRouter;
