import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/BannerCn.js";

const bannerRouter = Router();

bannerRouter.route("/").get(getAll).post(create);
bannerRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default bannerRouter;
