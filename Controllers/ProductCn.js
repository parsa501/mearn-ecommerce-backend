import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Product from "../Models/ProductMd.js";
import Order from "../Models/OrderMd.js";
import Payment from "../Models/PaymentMd.js";
import fs from "fs";
import { __dirname } from "../app.js";

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
    .populate();
  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }

  const features = new ApiFeatures(Product, req.query, req.role)
    .addManualFilters({ _id: id })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const {
    createdBy,
    rating,
    rateCount,
    userBoughtCount,
    productVariantIds,
    defaultProductVariantId,
    _id,
    ...updateData
  } = req.body;

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const searchQuery = isAdmin
    ? { _id: id }
    : { _id: id, createdBy: req.userId };

  const oldProduct = await Product.findOne(searchQuery);

  if (!oldProduct) {
    return next(new HandleERROR("Product not found", 404));
  }

  const oldImages = oldProduct.images;

  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (Array.isArray(updateData.images)) {
    const removedImages = oldImages.filter(
      (image) => !product.images.includes(image),
    );

    removedImages.forEach((image) => {
      fs.unlink(`${__dirname}/Public/Uploads/${image}`, () => {});
    });
  }

  return res.status(200).json({
    success: true,
    data: product,
    message: "Product updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const searchQuery = isAdmin
    ? { _id: id }
    : { _id: id, createdBy: req.userId };

  const product = await Product.findOne(searchQuery);

  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }

  const orders = await Order.find({
    "items.productId": id,
  });

  const orderIds = orders.map((order) => order._id);

  const hasBeenBought = await Payment.exists({
    orderId: { $in: orderIds },
    status: "success",
  });

  if (hasBeenBought) {
    product.isPublished = false;
    await product.save();

    return res.status(200).json({
      success: true,
      data: product,
      message: "Product unpublished because it has successful purchases",
    });
  }

  await product.deleteOne();

  product.images.forEach((image) => {
    fs.unlink(`${__dirname}/Public/Uploads/${image}`, () => {});
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
