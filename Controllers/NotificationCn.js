
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Notification from "../Models/NotificationMd.js";

export const create = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const notification = await Notification.create(req.body);

  return res.status(201).json({
    success: true,
    data: notification,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Notification, req.query, req.role);

  if (req.role !== "admin" && req.role !== "superAdmin") {
    features.addManualFilters({ userId: req.userId });
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
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new HandleERROR("Notification not found", 404));
  }

  if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    notification.userId.toString() !== req.userId.toString()
  ) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  return res.status(200).json({
    success: true,
    data: notification,
  });
});

export const update = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new HandleERROR("Notification not found", 404));
  }

  if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    notification.userId.toString() !== req.userId.toString()
  ) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  if (req.role !== "admin" && req.role !== "superAdmin") {
    const allowedFields = ["isRead"];

    const requestedFields = Object.keys(req.body);

    if (requestedFields.some((field) => !allowedFields.includes(field))) {
      return next(new HandleERROR("You can only update isRead", 403));
    }
  }

  Object.assign(notification, req.body);

  await notification.save();

  return res.status(200).json({
    success: true,
    data: notification,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new HandleERROR("Notification not found", 404));
  }

  if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    notification.userId.toString() !== req.userId.toString()
  ) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  await notification.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});
