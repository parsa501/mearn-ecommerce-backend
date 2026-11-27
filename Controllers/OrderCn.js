
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Order from "../Models/OrderMd.js";

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Order, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? {}
        : { userId: req.userId }
    )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "userId", select: "phoneNumber fullName" },
      { path: "discountId", select: "code discountType value" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});


export const getOne = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Order, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.userId }
    )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "userId", select: "phoneNumber fullName" },
      { path: "discountId", select: "code discountType value" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});


export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return next(new HandleERROR("Invalid order status", 400));
  }

  const order = await Order.findById(id);

  if (!order) {
    return next(new HandleERROR("No order found with that ID", 404));
  }

  if (order.status === "cancelled" || order.status === "delivered") {
    return next(
      new HandleERROR("This order can no longer be updated", 400)
    );
  }

  order.status = status;
  await order.save();

  return res.status(200).json({
    success: true,
    data: order,
    message: "Order status updated successfully",
  });
});
