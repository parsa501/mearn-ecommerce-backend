import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/AttributeCn.js";

const attributeRouter = express.Router();

attributeRouter.route("/").post(create).get(getAll);
attributeRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default attributeRouter;
