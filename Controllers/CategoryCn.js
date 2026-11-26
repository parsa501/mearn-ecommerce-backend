
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import fs from "fs";
import { __dirname } from "../app.js";
import Category from "../Models/CategoryMd.js";
import Product from "../Models/ProductMd.js";
import Attribute from "../Models/AttributeMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { parentId } = req.body;

  if (parentId) {
    const parentCategory = await Category.findById(parentId);

    if (!parentCategory) {
      return next(new HandleERROR("Parent category not found", 404));
    }
  }

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category,
    message: "Category created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Category, req.query, req.role)
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

  const features = new ApiFeatures(Category, req.query, req.role)
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
    return next(new HandleERROR("Category not found", 404));
  }

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { _id, ...updateData } = req.body;

  const oldCategory = await Category.findById(id);

  if (!oldCategory) {
    return next(new HandleERROR("Category not found", 404));
  }

  if (updateData.parentId) {
    if (updateData.parentId.toString() === id) {
      return next(new HandleERROR("Category cannot be its own parent", 400));
    }

    const parentCategory = await Category.findById(updateData.parentId);

    if (!parentCategory) {
      return next(new HandleERROR("Parent category not found", 404));
    }
  }

  const oldImage = oldCategory.image;

  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (
    updateData.image !== undefined &&
    oldImage &&
    updateData.image !== oldImage
  ) {
    fs.unlink(`${__dirname}/Public/Uploads/${oldImage}`, () => {});
  }

  return res.status(200).json({
    success: true,
    data: category,
    message: "Category updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return next(new HandleERROR("Category not found", 404));
  }

  const [childCategory, product, attribute] = await Promise.all([
    Category.findOne({ parentId: id }),
    Product.findOne({ categoryId: id }),
    Attribute.findOne({ categories: id }),
  ]);

  if (childCategory) {
    return next(
      new HandleERROR("Cannot delete category with child categories", 400),
    );
  }

  if (product) {
    return next(
      new HandleERROR("Cannot delete category with assigned products", 400),
    );
  }

  if (attribute) {
    return next(
      new HandleERROR("Cannot delete category used by attributes", 400),
    );
  }

  await Category.findByIdAndDelete(id);

  if (category.image) {
    fs.unlink(`${__dirname}/Public/Uploads/${category.image}`, () => {});
  }

  return res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
