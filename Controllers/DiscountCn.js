
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Discount from "../Models/DiscountMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { userIdsUsed, ...data } = req.body;

  const discount = await Discount.create(data);

  return res.status(201).json({
    success: true,
    data: discount,
    message: "Discount created successfully",
  });
});


