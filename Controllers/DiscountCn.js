
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

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Discount, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Discount, req.query, req.role)
    .addManualFilters({ _id: req.params.id })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json(result);
});

