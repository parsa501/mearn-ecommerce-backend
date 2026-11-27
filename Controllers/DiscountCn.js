
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
      (updateData.value !== undefined &&
        updateData.value !== discount.value))
  ) {
    return next(
      new HandleERROR(
        "Cannot update discount type or value after the discount has been used",
        400
      )
    );
  }

  const updatedDiscount = await Discount.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

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
      new HandleERROR("Cannot delete a discount that has been used", 400)
    );
  }

  await Discount.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Discount deleted successfully",
  });
});

