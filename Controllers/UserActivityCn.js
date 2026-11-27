
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import UserActivity from "../Models/UserActivityMd.js";

export const logActivity = async ({
  userId,
  activityType,
  targetId,
  targetType,
  description,
}) => {
  await UserActivity.create({
    userId,
    activityType,
    targetId,
    targetType,
    description,
  }).catch(() => {});
};

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(UserActivity, req.query, req.role);

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
  const activity = await UserActivity.findById(req.params.id);

  if (!activity) {
    return next(new HandleERROR("Activity not found", 404));
  }

  if (
    req.role !== "admin" &&
    req.role !== "superAdmin" &&
    activity.userId.toString() !== req.userId.toString()
  ) {
    return next(new HandleERROR("You are not authorized", 403));
  }

  return res.status(200).json({
    success: true,
    data: activity,
  });
});
