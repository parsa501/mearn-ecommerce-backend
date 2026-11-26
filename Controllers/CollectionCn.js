import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Collection from "../Models/CollectionMd.js";

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
    .addManualFilters(isAdmin)
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
  const { userId, _id, ...updateData } = req.body;

  const collection = await Collection.findOneAndUpdate(updateData, {
    new: true,
    runValidators: true,
  });

  if (!collection) {
    return next(new HandleERROR("Collection not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: collection,
    message: "Collection updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;


  const collection =await collection.findByIdAnddelte(id)
  if (!collection) {
    return next(new HandleERROR("Collection not found", 404));
  }


  return res.status(200).json({
    success: true,
    message: "Collection deleted successfully",
  });
});
