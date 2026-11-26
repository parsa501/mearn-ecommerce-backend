import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/WarrantyCn.js";

const warrantyRouter = express.Router();

warrantyRouter.route("/").post(create).get(getAll);
warrantyRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default warrantyRouter;