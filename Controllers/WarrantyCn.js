import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Warranty from "../Models/WarrantyMd.js";
import ProductListing from "../Models/ProductListingMd.js";

export const create = catchAsync(async (req, res, next) => {
  const warranty = await Warranty.create(req.body);

  res.status(201).json({
    success: true,
    data: warranty,
    message: "Warranty created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Warranty, req.query, req.role)
    .addManualFilters(isAdmin ? {} : { isPublished: true })
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

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Warranty, req.query, req.role)
    .addManualFilters({
      _id: id,
      ...(isAdmin ? {} : { isPublished: true }),
    })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  if (!result || (Array.isArray(result) && !result.length)) {
    return next(new HandleERROR("Warranty not found", 404));
  }

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id, ...updateData } = req.body;

  const warranty = await Warranty.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!warranty) {
    return next(new HandleERROR("Warranty not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: warranty,
    message: "Warranty updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const warranty = await Warranty.findById(id);

  if (!warranty) {
    return next(new HandleERROR("Warranty not found", 404));
  }

  const productListing = await ProductListing.findOne({ warrantyId: id });

  if (productListing) {
    return next(
      new HandleERROR(
        "Cannot delete warranty assigned to product listings",
        400,
      ),
    );
  }

  await Warranty.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Warranty deleted successfully",
  });
});
