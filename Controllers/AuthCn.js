import { catchAsync, HandleERROR } from "vanta-api";
import User from "../Models/UserMd.js";
import { sendAuthCode } from "../Utils/SmsHandler.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Cart from "../Models/CartMd.js";
import { verifyCode } from "../Utils/SmsHandler.js";

export const auth = catchAsync(async (req, res, next) => {
  const { phoneNumber = null } = req.body;

  if (!phoneNumber) {
    return next(new HandleERROR("Phone number is required", 400));
  }

  const regexPhone = /^(?:\+98|0)?9\d{9}$/;

  if (!regexPhone.test(phoneNumber)) {
    return next(new HandleERROR("Invalid phone number format", 400));
  }

  const user = await User.findOne({ phoneNumber });

  if (user && !user.isActive) {
    return next(new HandleERROR("Your account is inactive", 403));
  }

  if (!user || !user.password) {
    const smsResult = await sendAuthCode(phoneNumber);

    if (!smsResult.success) {
      return next(new HandleERROR(smsResult.message, 500));
    }
  }

  return res.status(200).json({
    success: true,
    userExist: Boolean(user),
    passwordExist: Boolean(user?.password),
    message: user?.password ? "login with password" : "send verification code",
  });
});

export const loginWithPassword = catchAsync(async (req, res, next) => {
  const { phoneNumber = null, password = null } = req.body;

  if (!phoneNumber || !password) {
    return next(new HandleERROR("Phone number and password are required", 400));
  }

  const user = await User.findOne({ phoneNumber });

  if (!user || !user.password) {
    return next(new HandleERROR("Phone number or password is incorrect", 401));
  }

  if (!user.isActive) {
    return next(new HandleERROR("Your account is inactive", 403));
  }

  const isMatch = await bcryptjs.compare(password, user.password);

  if (!isMatch) {
    return next(new HandleERROR("Phone number or password is incorrect", 401));
  }

  user.lastLogin = new Date();
  user.lastSeen = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  const userData = user.toObject();
  delete userData.password;

  return res.status(200).json({
    success: true,
    data: {
      user: userData,
      token,
    },
    message: "Login successfully",
  });
});

export const loginWithOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber = null, code = null } = req.body;

  if (!phoneNumber || !code) {
    return next(new HandleERROR("Phone number and code are required", 400));
  }

  const smsResult = await verifyCode(phoneNumber, code);

  if (!smsResult.success) {
    return next(new HandleERROR("Invalid code", 401));
  }

  let user = await User.findOne({ phoneNumber });

  if (user && !user.isActive) {
    return next(new HandleERROR("Your account is inactive", 403));
  }

  if (!user) {
    user = await User.create({
      phoneNumber,
      isPhoneVerified: true,
      lastLogin: new Date(),
      lastSeen: new Date(),
    });
  } else {
    user.isPhoneVerified = true;
    user.lastLogin = new Date();
    user.lastSeen = new Date();
  }

  if (!user.cartId) {
    const cart = await Cart.create({ userId: user._id });
    user.cartId = cart._id;
  }

  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  const userData = user.toObject();
  delete userData.password;

  return res.status(200).json({
    success: true,
    data: {
      user: userData,
      token,
    },
    message: "Login successfully",
  });
});
