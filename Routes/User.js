import express from "express";
import { getAll, getOne, update } from "../Controllers/UserCn.js";

const userRouter = express.Router();

userRouter.get("/", getAll);
userRouter.get("/:id", getOne).patch("/:id", update);

export default userRouter;
