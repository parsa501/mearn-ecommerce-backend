import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Address from "../Models/AddressMd.js";
import User from "../Models/UserMd.js";

export const create = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new HandleERROR("User not found", 404));
  }

  const address = await Address.create({
    ...req.body,
    userId: req.userId,
  });

  await User.findByIdAndUpdate(req.userId, {
    $push: { addressIds: address._id },
  });

  return res.status(201).json({
    success: true,
    data: address,
    message: "Address created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const features = new ApiFeatures(Address, req.query, req.role)
    .addManualFilters(isAdmin ? {} : { userId: req.userId })
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
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const searchQuery = isAdmin ? { _id: id } : { _id: id, userId: req.userId };

  const address = await Address.findOne(searchQuery);

  if (!address) {
    return next(new HandleERROR("Address not found", 404));
  }

  const features = new ApiFeatures(Address, req.query, req.role)
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

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const searchQuery = isAdmin ? { _id: id } : { _id: id, userId: req.userId };

  const address = await Address.findOneAndUpdate(searchQuery, updateData, {
    new: true,
    runValidators: true,
  });

  if (!address) {
    return next(new HandleERROR("Address not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: address,
    message: "Address updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const address = await Address.findById(id);

  if (!address) {
    return next(new HandleERROR("Address not found", 404));
  }

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  if (address.userId.toString() !== req.userId && !isAdmin) {
    return next(
      new HandleERROR("You are not authorized to delete this address", 403),
    );
  }

  await address.deleteOne();

  await User.findByIdAndUpdate(address.userId, {
    $pull: { addressIds: address._id },
  });

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});
