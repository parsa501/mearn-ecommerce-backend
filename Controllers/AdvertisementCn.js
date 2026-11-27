import fs from "fs/promises";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Advertisement from "../Models/AdvertisementMd.js";
import { __dirname } from "../app.js";

export const create = catchAsync(async (req, res, next) => {
  const advertisement = await Advertisement.create({
    ...req.body,
    image: req.file?.filename,
  });

  return res.status(201).json({
    success: true,
    data: advertisement,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Advertisement, req.query, req.role)
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
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return next(new HandleERROR("Advertisement not found", 404));
  }

  if (
    !advertisement.isPublished &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(new HandleERROR("Advertisement not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: advertisement,
  });
});

export const update = catchAsync(async (req, res, next) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return next(new HandleERROR("Advertisement not found", 404));
  }

  const oldImage = advertisement.image;

  Object.assign(advertisement, req.body);

  if (req.file) {
    advertisement.image = req.file.filename;
  }

  await advertisement.save();

  if (req.file && oldImage) {
    await fs.unlink(`${__dirname}/Public/Uploads/${oldImage}`).catch(() => {});
  }

  return res.status(200).json({
    success: true,
    data: advertisement,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return next(new HandleERROR("Advertisement not found", 404));
  }

  await advertisement.deleteOne();

  if (advertisement.image) {
    await fs
      .unlink(`${__dirname}/Public/Uploads/${advertisement.image}`)
      .catch(() => {});
  }

  return res.status(204).json({
    success: true,
    data: null,
  });
});
