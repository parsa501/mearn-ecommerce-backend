import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import SellerProfile from "../Models/SellerProfileMd.js";

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(SellerProfile, req.query, req.role)
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

  const profile = await SellerProfile.findById(id);

  if (!profile) {
    return next(new HandleERROR("Seller profile not found", 404));
  }

  if (
    profile.userId?.toString() !== req.userId &&
    req.role !== "admin" &&
    req.role !== "superAdmin"
  ) {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  const features = new ApiFeatures(SellerProfile, req.query, req.role)
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

  const profile = await SellerProfile.findById(id);

  if (!profile) {
    return next(new HandleERROR("Seller profile not found", 404));
  }

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  if (profile.userId.toString() !== req.userId && !isAdmin) {
    return next(
      new HandleERROR("You are not allowed to access this resource", 403),
    );
  }

  const {
    storeName,
    storeDescription,
    storeLogo,
    storeBanner,
    nationalId,
    businessAddress,
    postalCode,
    bankAccount,
    status,
  } = req.body;

  profile.storeName = storeName ?? profile.storeName;
  profile.storeDescription = storeDescription ?? profile.storeDescription;
  profile.storeLogo = storeLogo ?? profile.storeLogo;
  profile.storeBanner = storeBanner ?? profile.storeBanner;
  profile.businessAddress = businessAddress ?? profile.businessAddress;
  profile.postalCode = postalCode ?? profile.postalCode;
  profile.bankAccount = bankAccount ?? profile.bankAccount;

  if (isAdmin) {
    profile.nationalId = nationalId ?? profile.nationalId;

    if (status !== undefined) {
      if (!["active", "suspended", "inactive"].includes(status)) {
        return next(new HandleERROR("Invalid seller status", 400));
      }

      profile.status = status;
    }
  }

  await profile.save();

  return res.status(200).json({
    success: true,
    data: profile,
    message: "Seller profile updated successfully",
  });
});