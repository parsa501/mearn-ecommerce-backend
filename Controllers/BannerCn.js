import fs from "fs/promises";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Banner from "../Models/BannerMd.js";
import { __dirname } from "../app.js";

export const create = catchAsync(async (req, res, next) => {
  const banner = await Banner.create({
    ...req.body,
    image: req.file?.filename,
  });

  return res.status(201).json({
    success: true,
    data: banner,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Banner, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? {}
        : { isPublished: true },
    )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new HandleERROR("Banner not found", 404));
  }

  if (
    !banner.isPublished &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(new HandleERROR("Banner not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: banner,
  });
});

export const update = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new HandleERROR("Banner not found", 404));
  }

  const oldImage = banner.image;

  Object.assign(banner, req.body);

  if (req.file) {
    banner.image = req.file.filename;
  }

  await banner.save();

  if (req.file && oldImage) {
    await fs.unlink(`${__dirname}/Public/Uploads/${oldImage}`).catch(() => {});
  }

  return res.status(200).json({
    success: true,
    data: banner,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new HandleERROR("Banner not found", 404));
  }

  await banner.deleteOne();

  if (banner.image) {
    await fs
      .unlink(`${__dirname}/Public/Uploads/${banner.image}`)
      .catch(() => {});
  }

  return res.status(204).json({
    success: true,
    data: null,
  });
});
