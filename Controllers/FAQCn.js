
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import FAQ from "../Models/FAQMd.js";

export const create = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const faq = await FAQ.create(req.body);

  return res.status(201).json({
    success: true,
    data: faq,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(FAQ, req.query, req.role);

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
  const faq = await FAQ.findById(req.params.id);

  if (!faq) {
    return next(new HandleERROR("FAQ not found", 404));
  }

  if (
    !faq.isPublished &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(new HandleERROR("FAQ not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: faq,
  });
});

export const update = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const faq = await FAQ.findById(req.params.id);

  if (!faq) {
    return next(new HandleERROR("FAQ not found", 404));
  }

  Object.assign(faq, req.body);

  await faq.save();

  return res.status(200).json({
    success: true,
    data: faq,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const faq = await FAQ.findById(req.params.id);

  if (!faq) {
    return next(new HandleERROR("FAQ not found", 404));
  }

  await faq.deleteOne();

  return res.status(200).json({
    success: true,
    message: "FAQ deleted successfully",
  });
});
