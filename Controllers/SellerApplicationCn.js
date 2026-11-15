
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import SellerApplication from "../Models/SellerApplicationMd.js";
import User from "../Models/UserMd.js";
import SellerProfile from "../Models/SellerProfileMd.js";

export const create = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new HandleERROR("User not found", 404));
  }

  if (user.role === "seller" || user.role === "admin" || user.role === "superAdmin") {
    return next(new HandleERROR("You are already a seller or administrator", 400));
  }

  const applicationExist = await SellerApplication.findOne({
    userId: req.userId,
    status: { $in: ["pending", "revision", "approved"] },
  });

  if (applicationExist) {
    return next(new HandleERROR("You already have an active or approved application", 400));
  }

  const application = await SellerApplication.create({
    ...req.body,
    userId: req.userId,
    status: "pending",
    adminNote: "",
    revisionNote: "",
  });

  return res.status(201).json({
    success: true,
    data: application,
    message: "Seller application created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(SellerApplication, req.query, req.role)
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

  const application = await SellerApplication.findById(id);

  if (!application) {
    return next(new HandleERROR("Application not found", 404));
  }

  if (
    application.userId.toString() !== req.userId &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  const features = new ApiFeatures(SellerApplication, req.query, req.role)
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

  const application = await SellerApplication.findById(id);

  if (!application) {
    return next(new HandleERROR("Application not found", 404));
  }

  if (application.userId.toString() === req.userId) {
    if (application.status !== "revision") {
      return next(new HandleERROR("Your application cannot be edited", 403));
    }

    const {
      sellerType,
      storeName,
      ownerName,
      phoneNumber,
      email,
      storeAddress,
      postalCode,
      warehouseAddress,
      storeDescription,
      documents,
    } = req.body;

    application.sellerType = sellerType ?? application.sellerType;
    application.storeName = storeName ?? application.storeName;
    application.ownerName = ownerName ?? application.ownerName;
    application.phoneNumber = phoneNumber ?? application.phoneNumber;
    application.email = email ?? application.email;
    application.storeAddress = storeAddress ?? application.storeAddress;
    application.postalCode = postalCode ?? application.postalCode;
    application.warehouseAddress =
      warehouseAddress ?? application.warehouseAddress;
    application.storeDescription =
      storeDescription ?? application.storeDescription;
    application.documents = documents ?? application.documents;

    application.status = "pending";
    application.revisionNote = "";
    application.adminNote = "";

    await application.save();

    return res.status(200).json({
      success: true,
      data: application,
      message: "Application resubmitted successfully",
    });
  }

  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  const { action, adminNote = "", revisionNote = "" } = req.body;

  if (application.status !== "pending") {
    return next(
      new HandleERROR("This application has already been reviewed", 400),
    );
  }

  if (action === "approve") {
    const user = await User.findById(application.userId);

    if (!user) {
      return next(new HandleERROR("User not found", 404));
    }

    if (user.role !== "user") {
      return next(new HandleERROR("This user cannot become a seller", 400));
    }

    const profileExist = await SellerProfile.findOne({
      userId: application.userId,
    });

    if (profileExist) {
      return next(new HandleERROR("Seller profile already exists", 400));
    }

    await SellerProfile.create({
      userId: application.userId,
      storeName: application.storeName,
      storeDescription: application.storeDescription,
      sellerType: application.sellerType,
      businessAddress: application.storeAddress,
      postalCode: application.postalCode,
    });

    user.role = "seller";
    await user.save();

    application.status = "approved";
    application.adminNote = adminNote;
    application.revisionNote = "";

    await application.save();
  } else if (action === "reject") {
    application.status = "rejected";
    application.adminNote = adminNote;
    application.revisionNote = "";

    await application.save();
  } else if (action === "revision") {
    if (!revisionNote.trim()) {
      return next(new HandleERROR("Revision note is required", 400));
    }

    application.status = "revision";
    application.revisionNote = revisionNote;
    application.adminNote = "";

    await application.save();
  } else {
    return next(new HandleERROR("Invalid action", 400));
  }

  return res.status(200).json({
    success: true,
    data: application,
    message: "Application updated successfully",
  });
});
