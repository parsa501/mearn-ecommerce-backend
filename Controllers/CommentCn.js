
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Product from "../Models/ProductMd.js";
import Comment from "../Models/CommentMd.js";
import User from "../Models/UserMd.js";

export const create = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new HandleERROR("User not found", 404));
  }

  const product = await Product.findById(req.body.productId);

  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }

  const requestedRating = req.body.rating ?? 0;

  if (
    !Number.isInteger(requestedRating) ||
    requestedRating < 0 ||
    requestedRating > 5
  ) {
    return next(new HandleERROR("Rating must be between 0 and 5", 400));
  }

  let rating;

  if (
    !user.boughtProducts?.find(
      (productId) => productId.toString() === req.body.productId
    )
  ) {
    rating = 0;
  } else if (
    user.ratedProducts?.find(
      (productId) => productId.toString() === req.body.productId
    )
  ) {
    return next(new HandleERROR("You have already rated this product", 400));
  } else {
    rating = requestedRating;
  }

  const comment = await Comment.create({
    ...req.body,
    userId: req.userId,
    rating,
    isPublished: false,
  });

  if (rating >= 1) {
    product.rating =
      (product.rating * product.rateCount + rating) / (product.rateCount + 1);
    product.rateCount += 1;

    user.ratedProducts.push(product._id);

    await product.save();
    await user.save();
  }

  return res.status(201).json({
    success: true,
    data: comment,
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not allowed to perform this action", 403));
  }

  const features = new ApiFeatures(Comment, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      {
        path: "userId",
        select: "phoneNumber fullname",
      },
      {
        path: "productId",
        select: "title",
      },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getAllPostComments = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Comment, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? { productId: req.params.id }
        : { isPublished: true, productId: req.params.id }
    )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      {
        path: "userId",
        select: "phoneNumber fullname",
      },
      {
        path: "productId",
        select: "title",
      },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const changePublish = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not allowed to perform this action", 403));
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new HandleERROR("Comment not found", 404));
  }

  comment.isPublished = !comment.isPublished;

  await comment.save();

  return res.status(200).json({
    success: true,
    data: comment,
  });
});
