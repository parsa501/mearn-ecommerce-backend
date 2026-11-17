import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Variant from "../Models/VariantMd.js";
import Attribute from "../Models/AttributeMd.js";
import ProductVariant from "../Models/ProductVariantMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { attributeId, value } = req.body;

  const attribute = await Attribute.findById(attributeId);

  if (!attribute) {
    return next(new HandleERROR("Attribute not found", 404));
  }

  const variantExist = await Variant.findOne({ attributeId, value });

  if (variantExist) {
    return next(new HandleERROR("Variant already exists", 400));
  }

  const variant = await Variant.create({ attributeId, value });

  return res.status(201).json({
    success: true,
    data: variant,
    message: "Variant created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Variant, req.query, req.role)
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

  const variant = await Variant.findById(id);
  if (!variant) {
    return next(new HandleERROR("Variant not found", 404));
  }
  const features = new ApiFeatures(Variant, req.query, req.role)
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

  const variant = await Variant.findById(id);

  if (!variant) {
    return next(new HandleERROR("Variant not found", 404));
  }

  if (updateData.attributeId) {
    const attribute = await Attribute.findById(updateData.attributeId);

    if (!attribute) {
      return next(new HandleERROR("Attribute not found", 404));
    }
  }

  const attributeId = updateData.attributeId || variant.attributeId;
  const value = updateData.value ?? variant.value;

  const variantExist = await Variant.findOne({
    _id: { $ne: id },
    attributeId,
    value,
  });

  if (variantExist) {
    return next(new HandleERROR("Variant already exists", 400));
  }

  const updatedVariant = await Variant.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    data: updatedVariant,
    message: "Variant updated successfully",
  });
});
export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const variant = await Variant.findById(id);

  if (!variant) {
    return next(new HandleERROR("Variant not found", 404));
  }

  const isUsed = await ProductVariant.exists({
    variants: id,
  });

  if (isUsed) {
    return next(
      new HandleERROR("Variant is used by products and cannot be deleted", 400),
    );
  }

  await variant.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Variant deleted successfully",
  });
});
