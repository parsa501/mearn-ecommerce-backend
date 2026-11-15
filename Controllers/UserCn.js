import ApiFeatures, { catchAsync } from "vanta-api";
import User from "../Models/UserMd";
import bcryptjs from "bcryptjs";

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(User, req.query, req.role)
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

  if (id !== req.userId && req.role !== "admin" && req.role !== "superAdmin") {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  const features = new ApiFeatures(User, req.query, req.role)
    .addManualFilters({ _id: id })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate(["ratedProducts", "cartId", "boughtProducts", "addressIds"]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const {
    fullname = null,
    password = null,
    role = null,
    isActive = null,
  } = req.body;

  const { id } = req.params;

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  if (id !== req.userId && !isAdmin) {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  if (role !== null && req.role !== "superAdmin") {
    return next(new HandleERROR("Only super admin can change user roles", 403));
  }

  if (isActive !== null && !isAdmin) {
    return next(
      new HandleERROR("You are not allowed to change account status", 403),
    );
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new HandleERROR("User not found", 404));
  }

  if (fullname !== null) {
    user.fullname = fullname;
  }

  if (password !== null) {
    user.password = await bcryptjs.hash(password, 12);
  }

  if (role !== null) {
    user.role = role;
  }

  if (isActive !== null) {
    user.isActive = isActive;
  }

  const newUser = await user.save();

  const userData = newUser.toObject();
  delete userData.password;

  return res.status(200).json({
    success: true,
    data: {
      user: userData,
    },
  });
});
