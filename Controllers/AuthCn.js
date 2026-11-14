import { catchAsync, HandleERROR } from "vanta-api";
import User from "../Models/UserMd.js";
import { sendAuthCode } from "../Utils/SmsHandler.js";

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
    message: user?.password
      ? "login with password"
      : "send verification code",
  });
});