
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Payment from "../Models/PaymentMd.js";

export const getAll = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not allowed to access all payments", 403));
  }

  const features = new ApiFeatures(Payment, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "orderId" },
      { path: "userId", select: "phoneNumber fullName" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("orderId")
    .populate("userId", "phoneNumber fullName");

  if (!payment) {
    return next(new HandleERROR("No payment found with that ID", 404));
  }

  if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    payment.userId._id.toString() !== req.userId
  ) {
    return next(new HandleERROR("You are not allowed to access this payment", 403));
  }

  return res.status(200).json({
    success: true,
    data: payment,
  });
});

export const getMyPayments = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Payment, req.query, req.role)
    .addManualFilters({ userId: req.userId })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "orderId" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});
