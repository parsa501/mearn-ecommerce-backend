import fs from "fs/promises";
import path from "path";
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Story from "../Models/StoryMd.js";
import SellerProfile from "../Models/SellerProfileMd.js";
import { __dirname } from "../app.js";

export const create = catchAsync(async (req, res, next) => {
  if (req.role !== "seller") {
    return next(new HandleERROR("Only sellers can create stories", 403));
  }

  if (!req.file) {
    return next(new HandleERROR("Story media is required", 400));
  }

  const sellerProfile = await SellerProfile.findOne({
    userId: req.userId,
  });

  if (!sellerProfile) {
    return next(new HandleERROR("Seller profile not found", 404));
  }

  const story = await Story.create({
    ...req.body,
    media: req.file.filename,
    sellerId: sellerProfile._id,
    isPublished: false,
  });

  return res.status(201).json({
    success: true,
    data: story,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Story, req.query, req.role);

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (!sellerProfile) {
      return next(new HandleERROR("Seller profile not found", 404));
    }

    features.addManualFilters({ sellerId: sellerProfile._id });
  } else if (req.role !== "admin" && req.role !== "superAdmin") {
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
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new HandleERROR("Story not found", 404));
  }

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (
      !sellerProfile ||
      story.sellerId.toString() !== sellerProfile._id.toString()
    ) {
      return next(new HandleERROR("You are not authorized", 403));
    }
  } else if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    !story.isPublished
  ) {
    return next(new HandleERROR("Story not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: story,
  });
});

export const update = catchAsync(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new HandleERROR("Story not found", 404));
  }

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (
      !sellerProfile ||
      story.sellerId.toString() !== sellerProfile._id.toString()
    ) {
      return next(new HandleERROR("You are not authorized", 403));
    }
  } else if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const oldMedia = story.media;
  const updateData = { ...req.body };

  delete updateData.sellerId;
  delete updateData.media;

  Object.assign(story, updateData);

  if (req.file) {
    story.media = req.file.filename;
  }

  if (req.role === "seller") {
    story.isPublished = false;
  }

  await story.save();

  if (req.file && oldMedia) {
    await fs
      .unlink(path.join(__dirname, "Public/Uploads", oldMedia))
      .catch(() => {});
  }

  return res.status(200).json({
    success: true,
    data: story,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return next(new HandleERROR("Story not found", 404));
  }

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (
      !sellerProfile ||
      story.sellerId.toString() !== sellerProfile._id.toString()
    ) {
      return next(new HandleERROR("You are not authorized", 403));
    }
  } else if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const media = story.media;

  await story.deleteOne();

  if (media) {
    await fs
      .unlink(path.join(__dirname, "Public/Uploads", media))
      .catch(() => {});
  }

  return res.status(200).json({
    success: true,
    message: "Story deleted successfully",
  });
});
