
import { Router } from "express";
import { Search } from "../Controllers/SearchCn.js";

const searchRouter = Router();

searchRouter.route("/").get(Search);

export default searchRouter;
