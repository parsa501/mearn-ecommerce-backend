
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
