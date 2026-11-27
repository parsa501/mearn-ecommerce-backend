
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import ContactMessage from "../Models/ContactMessageMd.js";

export const create = catchAsync(async (req, res, next) => {
  const contactMessage = await ContactMessage.create(req.body);

  return res.status(201).json({
    success: true,
    data: contactMessage,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const features = new ApiFeatures(ContactMessage, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json({
    success: true,
    result: result.length,
    data: result,
  });
});

export const getOne = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const contactMessage = await ContactMessage.findById(req.params.id);

  if (!contactMessage) {
    return next(new HandleERROR("Contact message not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: contactMessage,
  });
});

export const update = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const contactMessage = await ContactMessage.findById(req.params.id);

  if (!contactMessage) {
    return next(new HandleERROR("Contact message not found", 404));
  }

  Object.assign(contactMessage, req.body);

  await contactMessage.save();

  return res.status(200).json({
    success: true,
    data: contactMessage,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not authorized", 403));
  }

  const contactMessage = await ContactMessage.findById(req.params.id);

  if (!contactMessage) {
    return next(new HandleERROR("Contact message not found", 404));
  }

  await contactMessage.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Contact message deleted successfully",
  });
});
