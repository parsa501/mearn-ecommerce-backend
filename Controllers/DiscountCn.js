import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Discount from "../Models/DiscountMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { userIdsUsed, ...data } = req.body;

  const discount = await Discount.create(data);

  return res.status(201).json({
    success: true,
    data: discount,
    message: "Discount created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Discount, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate();

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Discount, req.query, req.role)
    .addManualFilters({ _id: req.params.id })
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
  const { userIdsUsed, ...updateData } = req.body;

  const discount = await Discount.findById(id);

  if (!discount) {
    return next(new HandleERROR("No discount found with that ID", 404));
  }

  if (
    discount.userIdsUsed.length > 0 &&
    ((updateData.discountType !== undefined &&
      updateData.discountType !== discount.discountType) ||
      (updateData.value !== undefined && updateData.value !== discount.value))
  ) {
    return next(
      new HandleERROR(
        "Cannot update discount type or value after the discount has been used",
        400,
      ),
    );
  }

  const updatedDiscount = await Discount.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    data: updatedDiscount,
    message: "Discount updated successfully",
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const discount = await Discount.findById(id);

  if (!discount) {
    return next(new HandleERROR("No discount found with that ID", 404));
  }

  if (discount.userIdsUsed.length > 0) {
    return next(
      new HandleERROR("Cannot delete a discount that has been used", 400),
    );
  }

  await Discount.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Discount deleted successfully",
  });
});

export const checkCode = (discount, totalPrice, userId) => {
  if (!discount || !discount.isPublished) {
    return {
      success: false,
      message: "This discount code is not available",
    };
  }

  if (totalPrice < discount.minPrice) {
    return {
      success: false,
      message: `Minimum price for this discount code is ${discount.minPrice}`,
    };
  }

  if (
    discount.userIdsUsed.some(
      (usedUserId) => usedUserId.toString() === userId.toString(),
    )
  ) {
    return {
      success: false,
      message: "You have already used this discount code",
    };
  }

  const now = new Date();

  if (discount.startTime > now || discount.expireTime < now) {
    return {
      success: false,
      message: "This discount code is invalid at this time",
    };
  }

  return {
    success: true,
    message: "Discount code is valid",
  };
};

export const checkDiscountCode = catchAsync(async (req, res, next) => {
  const { code, totalPrice } = req.body;

  if (!code || typeof totalPrice !== "number" || totalPrice < 0) {
    return next(
      new HandleERROR("Valid discount code and total price are required", 400),
    );
  }

  const discount = await Discount.findOne({
    code: code.trim().toUpperCase(),
  });

  if (!discount) {
    return next(new HandleERROR("Discount code not found", 404));
  }

  const check = checkCode(discount, totalPrice, req.userId);

  if (!check.success) {
    return next(new HandleERROR(check.message, 400));
  }

  let discountAmount =
    discount.discountType === "amount"
      ? discount.value
      : (totalPrice * discount.value) / 100;

  if (discount.maxDiscount !== null) {
    discountAmount = Math.min(discountAmount, discount.maxDiscount);
  }

  discountAmount = Math.min(discountAmount, totalPrice);

  const totalPriceAfterDiscount = totalPrice - discountAmount;

  return res.status(200).json({
    success: true,
    data: {
      discountType: discount.discountType,
      value: discount.value,
      discountAmount,
      totalPriceAfterDiscount,
    },
    message: "Discount code is valid",
  });
});
