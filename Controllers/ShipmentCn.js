
import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Shipment from "../Models/ShipmentMd.js";
import SellerProfile from "../Models/SellerProfileMd.js";
import Order from "../Models/OrderMd.js";

export const getAll = catchAsync(async (req, res, next) => {
  if (req.role !== "admin" && req.role !== "superAdmin") {
    return next(new HandleERROR("You are not allowed to access all shipments", 403));
  }

  const features = new ApiFeatures(Shipment, req.query, req.role)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "orderId" },
      { path: "sellerId" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id)
    .populate("orderId")
    .populate("sellerId");

  if (!shipment) {
    return next(new HandleERROR("No shipment found with that ID", 404));
  }

  if (req.role === "admin" || req.role === "superAdmin") {
    return res.status(200).json({
      success: true,
      data: shipment,
    });
  }

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({ userId: req.userId });

    if (!sellerProfile || shipment.sellerId._id.toString() !== sellerProfile._id.toString()) {
      return next(new HandleERROR("You are not allowed to access this shipment", 403));
    }
  } else if (req.role === "user") {
    const order = await Order.findOne({
      _id: shipment.orderId._id,
      userId: req.userId,
    });

    if (!order) {
      return next(new HandleERROR("You are not allowed to access this shipment", 403));
    }
  } else {
    return next(new HandleERROR("You are not allowed to access this shipment", 403));
  }

  return res.status(200).json({
    success: true,
    data: shipment,
  });
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (req.role !== "admin" && req.role !== "superAdmin" && req.role !== "seller") {
    return next(new HandleERROR("You are not allowed to update shipments", 403));
  }

  const shipment = await Shipment.findById(id);

  if (!shipment) {
    return next(new HandleERROR("No shipment found with that ID", 404));
  }

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({ userId: req.userId });

    if (!sellerProfile || shipment.sellerId.toString() !== sellerProfile._id.toString()) {
      return next(new HandleERROR("You are not allowed to update this shipment", 403));
    }
  }

  const allowedStatuses =
    req.role === "seller"
      ? ["preparing", "shipped", "delivered"]
      : ["pending", "preparing", "shipped", "delivered", "cancelled"];

  const {
    status,
    trackingCode,
    carrier,
    estimatedDelivery,
    shippingMethod,
    shippingCost,
  } = req.body;

  if (status !== undefined) {
    if (!allowedStatuses.includes(status)) {
      return next(new HandleERROR("Invalid shipment status", 400));
    }

    shipment.status = status;

    if (status === "shipped" && !shipment.shippedAt) {
      shipment.shippedAt = new Date();
    }

    if (status === "delivered" && !shipment.deliveredAt) {
      shipment.deliveredAt = new Date();
    }
  }

  if (trackingCode !== undefined) shipment.trackingCode = trackingCode;
  if (carrier !== undefined) shipment.carrier = carrier;
  if (estimatedDelivery !== undefined) shipment.estimatedDelivery = estimatedDelivery;

  if (req.role === "admin" || req.role === "superAdmin") {
    if (shippingMethod !== undefined) shipment.shippingMethod = shippingMethod;
    if (shippingCost !== undefined) shipment.shippingCost = shippingCost;
  }

  await shipment.save();

  return res.status(200).json({
    success: true,
    data: shipment,
    message: "Shipment updated successfully",
  });
});

export const getMyShipments = catchAsync(async (req, res, next) => {
  let filters = {};

  if (req.role === "seller") {
    const sellerProfile = await SellerProfile.findOne({ userId: req.userId });

    if (!sellerProfile) {
      return next(new HandleERROR("Seller profile not found", 404));
    }

    filters.sellerId = sellerProfile._id;
  } else if (req.role === "user") {
    const orderIds = await Order.find({ userId: req.userId }).distinct("_id");

    filters.orderId = { $in: orderIds };
  } else {
    return next(new HandleERROR("You are not allowed to access these shipments", 403));
  }

  const features = new ApiFeatures(Shipment, req.query, req.role)
    .addManualFilters(filters)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "orderId" },
      { path: "sellerId" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});
