
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Service from "../Models/ServiceMd.js";

export const create = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const service = await Service.create(req.body);

  return res.status(201).json({
    success: true,
    data: service,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Service, req.query, req.role);

  if (req.role !== "admin" && req.role !== "superAdmin") {
    features.addManualFilters({ isPublished: true });
  }

  features.filter().sort().limitFields().paginate().populate();

  const result = await features.execute();

  return res.status(200).json({
    success: true,
    result: result.length,
    data: result,
  });
});

export const getOne = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return next(new HandleERROR("Service not found", 404));
  }

  if (
    !service.isPublished &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(new HandleERROR("Service not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: service,
  });
});

export const update = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const service = await Service.findById(req.params.id);

  if (!service) {
    return next(new HandleERROR("Service not found", 404));
  }

  Object.assign(service, req.body);

  await service.save();

  return res.status(200).json({
    success: true,
    data: service,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const service = await Service.findById(req.params.id);

  if (!service) {
    return next(new HandleERROR("Service not found", 404));
  }

  await service.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Service deleted successfully",
  });
});
