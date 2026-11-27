import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/AdvertisementCn.js";

const advertisementRouter = Router();

advertisementRouter.route("/").get(getAll).post(create);
advertisementRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default advertisementRouter;
