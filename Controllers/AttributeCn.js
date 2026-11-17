import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Attribute from "../Models/AttributeMd.js";
import Product from "../Models/ProductMd.js";
export const create = catchAsync(async (req, res, next) => {
  const attribute = await Attribute.create(req.body);
  res.status(201).json({
    success: true,
    data: attribute,
    message: "Attribute created successfully",
  });
});
export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Attribute, req.query, req.role)
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

  const attribute = await Attribute.findById(id);

  if (!attribute) {
    return next(new HandleERROR("Attribute not found", 404));
  }

  const features = new ApiFeatures(Attribute, req.query, req.role)
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

  const attribute = await Attribute.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!attribute) {
    return next(new HandleERROR("Attribute not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: attribute,
    message: "Attribute updated successfully",
  });
});
export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const attribute = await Attribute.findById(id);

  if (!attribute) {
    return next(new HandleERROR("Attribute not found", 404));
  }

  const isUsed = await Product.exists({
    "attributeValues.attributeId": id,
  });

  if (isUsed) {
    return next(
      new HandleERROR(
        "This attribute is used by products and cannot be deleted",
        400,
      ),
    );
  }

  await attribute.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Attribute deleted successfully",
  });
});
