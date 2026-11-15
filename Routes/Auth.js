import express from "express";
import {
  auth,
  loginWithPassword,
  loginWithOtp,
  resendCode,
  forgetPassword,
} from "../Controllers/AuthCn.js";

const authRouter = express.Router();

authRouter.post("/", auth);
authRouter.post("/login-password", loginWithPassword);
authRouter.post("/login-otp", loginWithOtp);
authRouter.post("/resend-code", resendCode);
authRouter.post("/forget-password", forgetPassword);

export default authRouter;
