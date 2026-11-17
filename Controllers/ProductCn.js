import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Product from "../Models/ProductMd.js";
import Order from "../Models/OrderMd.js";
import Payment from "../Models/PaymentMd.js";

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

  const product = await Product.findOneAndUpdate(searchQuery, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: product,
    message: "Product updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

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

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
