import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import ProductListing from "../Models/ProductListingMd";
import SellerProfile from "../Models/SellerProfileMd.js";
import Product from "../Models/ProductMd.js";
import ProductVariant from "../Models/ProductVariantMd.js";
import Warranty from "../Models/WarrantyMd.js";

export const create = catchAsync(async (req, res, next) => {
  const { productId, productVariantId, warrantyId, price, quantity } = req.body;

  const sellerProfile = await SellerProfile.findOne({
    userId: req.userId,
    status: "active",
  });

  if (!sellerProfile) {
    return next(new HandleERROR("Active seller profile not found", 404));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new HandleERROR("Product not found", 404));
  }

  if (productVariantId) {
    const productVariant = await ProductVariant.findOne({
      _id: productVariantId,
      productId,
    });

    if (!productVariant) {
      return next(new HandleERROR("Product variant not found", 404));
    }
  }

  if (warrantyId) {
    const warranty = await Warranty.findById(warrantyId);

    if (!warranty) {
      return next(new HandleERROR("Warranty not found", 404));
    }
  }

  const productListing = await ProductListing.create({
    sellerId: sellerProfile._id,
    productId,
    productVariantId: productVariantId || null,
    warrantyId: warrantyId || null,
    price,
    quantity,
  });

  return res.status(201).json({
    success: true,
    data: productListing,
    message: "Product listing created successfully",
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  let manualFilters = {};

  if (!isAdmin) {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (!sellerProfile) {
      return next(new HandleERROR("Seller profile not found", 404));
    }

    manualFilters.sellerId = sellerProfile._id;
  }

  const features = new ApiFeatures(ProductListing, req.query, req.role)
    .addManualFilters(manualFilters)
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

  let searchQuery = { _id: id };

  if (!isAdmin) {
    const sellerProfile = await SellerProfile.findOne({
      userId: req.userId,
    });

    if (!sellerProfile) {
      return next(new HandleERROR("Seller profile not found", 404));
    }

    searchQuery.sellerId = sellerProfile._id;
  }

  const productListing = await ProductListing.findOne(searchQuery);

  if (!productListing) {
    return next(new HandleERROR("Product listing not found", 404));
  }

  const features = new ApiFeatures(ProductListing, req.query, req.role)
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
  const { _id, ...updateData } = req.body;

  const ProductListing = await ProductListing.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!ProductListing) {
    return next(new HandleERROR("ProductListing not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: ProductListing,
    message: "ProductListing updated successfully",
  });
});
export const remove = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const ProductListing = await ProductListing.findById(id);

  if (!ProductListing) {
    return next(new HandleERROR("ProductListing not found", 404));
  }

  await ProductListing.deleteOne();

  return res.status(200).json({
    success: true,
    message: "ProductListing deleted successfully",
  });
});
