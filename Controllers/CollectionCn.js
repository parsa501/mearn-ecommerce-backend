import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Collection from "../Models/CollectionMd.js";
import fs from "fs";
import { __dirname } from "../app.js";

export const create = catchAsync(async (req, res, next) => {
  const collection = await Collection.create(req.body);

  return res.status(201).json({
    success: true,
    data: collection,
    message: "Collection created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Collection, req.query, req.role)
    .addManualFilters(isAdmin ? {} : { isActive: true })
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

  const collection = await Collection.findById(id);

  if (!collection) {
    return next(new HandleERROR("Collection not found", 404));
  }

  if (
    !collection.isActive &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(new HandleERROR("Collection not found", 404));
  }

  const features = new ApiFeatures(Collection, req.query, req.role)
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

  const oldCollection = await Collection.findById(id);

  if (!oldCollection) {
    return next(new HandleERROR("Collection not found", 404));
  }

  const collection = await Collection.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (
    updateData.image &&
    oldCollection.image &&
    updateData.image !== oldCollection.image
  ) {
    fs.unlink(`${__dirname}/Public/Uploads/${oldCollection.image}`, () => {});
  }

  return res.status(200).json({
    success: true,
    data: collection,
    message: "Collection updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const collection = await Collection.findById(id);

  if (!collection) {
    return next(new HandleERROR("Collection not found", 404));
  }

  await Collection.findByIdAndDelete(id);

  if (collection.image) {
    fs.unlink(`${__dirname}/Public/Uploads/${collection.image}`, () => {});
  }

  return res.status(200).json({
    success: true,
    message: "Collection deleted successfully",
  });
});
