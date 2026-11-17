import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import ProductVariant from "../Models/ProductVariantMd.js";
import Product from "../Models/ProductMd.js";
import Variant from "../Models/VariantMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { productId, variants = [] } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }
  const productVariantExist = await ProductVariant.findOne({ productId });

  if (productVariantExist) {
    return next(
      new HandleERROR("Product variants already exist for this product", 400),
    );
  }

  const existingVariants = await Variant.find({
    _id: { $in: variants },
  });

  if (existingVariants.length !== new Set(variants.map(String)).size) {
    return next(new HandleERROR("One or more variants not found", 404));
  }

  const productVariant = await ProductVariant.create({
    productId,
    variants,
  });

  product.productVariantIds.push(productVariant._id);

  await product.save();

  return res.status(201).json({
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
  const { _id, productId, ...updateData } = req.body;

  const productVariant = await ProductVariant.findById(id);

  if (!productVariant) {
    return next(new HandleERROR("Product variant not found", 404));
  }

  const variants = updateData.variants;

  if (variants) {
    const existingVariants = await Variant.find({
      _id: { $in: variants },
    });

    if (existingVariants.length !== new Set(variants.map(String)).size) {
      return next(new HandleERROR("One or more variants not found", 404));
    }
  }

  const updatedProductVariant = await ProductVariant.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    data: updatedProductVariant,
    message: "Product variant updated successfully",
  });
});
export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const productVariant = await ProductVariant.findById(id);

  if (!productVariant) {
    return next(new HandleERROR("Product variant not found", 404));
  }

  await Product.findByIdAndUpdate(productVariant.productId, {
    $pull: { productVariantIds: productVariant._id },
  });

  await productVariant.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product variant deleted successfully",
  });
});
