
import { catchAsync, HandleERROR } from "vanta-api";
import CompareList from "../Models/CompareListMd.js";
import Product from "../Models/ProductMd.js";

export const getOne = catchAsync(async (req, res, next) => {
  const compareList = await CompareList.findOne({ userId: req.userId })
    .populate("productIds");

  return res.status(200).json({
    success: true,
    data: compareList || { productIds: [] },
  });
});

export const addProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new HandleERROR("Product ID is required", 400));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new HandleERROR("No product found with that ID", 404));
  }

  const compareList = await CompareList.findOneAndUpdate(
    { userId: req.userId },
    { $addToSet: { productIds: productId } },
    { new: true, upsert: true, runValidators: true },
  ).populate("productIds");

  return res.status(200).json({
    success: true,
    data: compareList,
    message: "Product added to compare list successfully",
  });
});

export const removeProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new HandleERROR("Product ID is required", 400));
  }

  const compareList = await CompareList.findOneAndUpdate(
    { userId: req.userId },
    { $pull: { productIds: productId } },
    { new: true },
  ).populate("productIds");

  if (!compareList) {
    return next(new HandleERROR("Compare list not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: compareList,
    message: "Product removed from compare list successfully",
  });
});

export const clear = catchAsync(async (req, res, next) => {
  const compareList = await CompareList.findOneAndUpdate(
    { userId: req.userId },
    { $set: { productIds: [] } },
    { new: true },
  );

  if (!compareList) {
    return next(new HandleERROR("Compare list not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: compareList,
    message: "Compare list cleared successfully",
  });
});
