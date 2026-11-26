import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/CollectionCn.js";

const collectionRouter = express.Router();

collectionRouter.route("/").post(create).get(getAll);
collectionRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default collectionRouter;