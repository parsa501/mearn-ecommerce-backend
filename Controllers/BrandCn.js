
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import fs from "fs";
import { __dirname } from "../app.js";
import Brand from "../Models/BrandMd.js";
import Product from "../Models/ProductMd.js";

export const create = catchAsync(async (req, res, next) => {
  const brand = await Brand.create(req.body);

  res.status(201).json({
    success: true,
    data: brand,
    message: "Brand created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Brand, req.query, req.role)
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

  const features = new ApiFeatures(Brand, req.query, req.role)
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
    return next(new HandleERROR("Brand not found", 404));
  }

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id, ...updateData } = req.body;

  const oldBrand = await Brand.findById(id);

  if (!oldBrand) {
    return next(new HandleERROR("Brand not found", 404));
  }

  const oldLogo = oldBrand.logo;

  const brand = await Brand.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (
    updateData.logo !== undefined &&
    oldLogo &&
    updateData.logo !== oldLogo
  ) {
    fs.unlink(`${__dirname}/Public/Uploads/${oldLogo}`, () => {});
  }

  return res.status(200).json({
    success: true,
    data: brand,
    message: "Brand updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const brand = await Brand.findById(id);

  if (!brand) {
    return next(new HandleERROR("Brand not found", 404));
  }

  const product = await Product.findOne({ brandId: id });

  if (product) {
    return next(
      new HandleERROR("Cannot delete brand with assigned products", 400),
    );
  }

  await Brand.findByIdAndDelete(id);

  if (brand.logo) {
    fs.unlink(`${__dirname}/Public/Uploads/${brand.logo}`, () => {});
  }

  return res.status(200).json({
    success: true,
    message: "Brand deleted successfully",
  });
});
