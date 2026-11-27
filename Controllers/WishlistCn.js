
import { catchAsync, HandleERROR } from "vanta-api";
import Wishlist from "../Models/WishlistMd.js";
import Product from "../Models/ProductMd.js";

export const getOne = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ userId: req.userId })
    .populate("productIds");

  return res.status(200).json({
    success: true,
    data: wishlist || { productIds: [] },
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

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: req.userId },
    { $addToSet: { productIds: productId } },
    { new: true, upsert: true, runValidators: true },
  ).populate("productIds");

  return res.status(200).json({
    success: true,
    data: wishlist,
    message: "Product added to wishlist successfully",
  });
});

export const removeProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new HandleERROR("Product ID is required", 400));
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: req.userId },
    { $pull: { productIds: productId } },
    { new: true },
  ).populate("productIds");

  if (!wishlist) {
    return next(new HandleERROR("Wishlist not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: wishlist,
    message: "Product removed from wishlist successfully",
  });
});

export const clear = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { userId: req.userId },
    { $set: { productIds: [] } },
    { new: true },
  );

  if (!wishlist) {
    return next(new HandleERROR("Wishlist not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: wishlist,
    message: "Wishlist cleared successfully",
  });
});
