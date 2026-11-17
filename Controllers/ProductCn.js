import { catchAsync, HandleERROR } from "vanta-api";
import Product from "../Models/ProductMd.js";

export const create = catchAsync(async (req, res, next) => {
  const {
    rating,
    rateCount,
    userBoughtCount,
    createdBy,
    isPublished,
    ...productData
  } = req.body;

  const product = await Product.create({
    ...productData,
    createdBy: req.userId,
    isPublished: false,
  });

  return res.status(201).json({
    success: true,
    data: product,
    message: "Product created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Product, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate()
  const result = await features.execute();

  return res.status(200).json(result);
});
