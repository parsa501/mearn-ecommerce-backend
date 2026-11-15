import express from "express";
import {
  create,
  getAll,
  getOne,
  update,
} from "../Controllers/SellerApplicationCn.js";

const sellerApplicationRouter = express.Router();

sellerApplicationRouter.post("/", create).get("/", getAll);
sellerApplicationRouter.get("/:id", getOne).patch("/:id", update);

export default sellerApplicationRouter;
