import express from "express";
import { getAll, getOne, update } from "../Controllers/SellerProfileCn.js";

const sellerProfileRouter = express.Router();

sellerProfileRouter.get("/", getAll);
sellerProfileRouter.get("/:id", getOne).patch("/:id", update);

export default sellerProfileRouter;
