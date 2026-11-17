import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import ProductVariant from "../Models/ProductVariantMd.js";
import Product from "../Models/ProductMd.js";
import Variant from "../Models/VariantMd.js";

export const create = catchAsync(async (req, res, next) => {
  const productVariant = await ProductVariant.create(req.body);
  const product = await Product.findById(productVariant.productId);
  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }
  res.status(201).json({
    success: true,
    data: productVariant,
    message: "Product variant created successfully",
  });
});
export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(ProductVariant, req.query, req.role)
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

  const productVariant = await ProductVariant.findById(id);

  if (!productVariant) {
    return next(new HandleERROR("Product variant not found", 404));
  }

  const features = new ApiFeatures(ProductVariant, req.query, req.role)
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
  const { _id, ...updateData } = req.body;

  const productVariant = await ProductVariant.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!productVariant) {
    return next(new HandleERROR("Product variant not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: productVariant,
    message: "Product variant updated successfully",
  });
});
export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const productVariant = await ProductVariant.findById(id);

  if (!productVariant) {
    return next(new HandleERROR("Product variant not found", 404));
  }


  await productVariant.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product variant deleted successfully",
  });
});
