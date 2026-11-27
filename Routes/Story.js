import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../Controllers/StoryCn.js";

const storyRouter = Router();

storyRouter.route("/").get(getAll).post(create);
storyRouter.route("/:id").get(getOne).patch(update).delete(remove);

export default storyRouter;
