import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import Order from "../Models/OrderMd.js";
import Cart from "../Models/CartMd.js";
import Address from "../Models/AddressMd.js";
import ProductListing from "../Models/ProductListingMd.js";
import Payment from "../Models/PaymentMd.js";
import Discount from "../Models/DiscountMd.js";
import { checkCode } from "./DiscountCn.js";
import { createPayment, ZARINPAL } from "../Services/ZarinpalService.js";
import mongoose from "mongoose";
import Shipment from "../Models/ShipmentMd.js";
import { verifyPayment } from "../Services/ZarinpalService.js";
export const getAll = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Order, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? {}
        : { userId: req.userId },
    )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "userId", select: "phoneNumber fullName" },
      { path: "discountId", select: "code discountType value" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const getOne = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Order, req.query, req.role)
    .addManualFilters(
      req.role === "admin" || req.role === "superAdmin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.userId },
    )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      { path: "userId", select: "phoneNumber fullName" },
      { path: "discountId", select: "code discountType value" },
    ]);

  const result = await features.execute();

  return res.status(200).json(result);
});

export const update = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return next(new HandleERROR("Invalid order status", 400));
  }

  const order = await Order.findById(id);

  if (!order) {
    return next(new HandleERROR("No order found with that ID", 404));
  }

  if (order.status === "cancelled" || order.status === "delivered") {
    return next(new HandleERROR("This order can no longer be updated", 400));
  }

  order.status = status;
  await order.save();

  return res.status(200).json({
    success: true,
    data: order,
    message: "Order status updated successfully",
  });
});

export const payment = catchAsync(async (req, res, next) => {
  const { addressId, discountCode } = req.body;

  if (!addressId) {
    return next(new HandleERROR("Address ID is required", 400));
  }

  const cart = await Cart.findOne({ userId: req.userId });

  if (!cart || cart.items.length === 0) {
    return next(new HandleERROR("Your cart is empty", 400));
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: req.userId,
  });

  if (!address) {
    return next(new HandleERROR("Address not found", 404));
  }

  const listingIds = cart.items.map((item) => item.listingId);

  const listings = await ProductListing.find({
    _id: { $in: listingIds },
    isPublished: true,
  });

  if (listings.length !== cart.items.length) {
    return next(new HandleERROR("Some products are unavailable", 400));
  }

  const orderItems = cart.items.map((item) => {
    const listing = listings.find(
      (listing) => listing._id.toString() === item.listingId.toString(),
    );

    if (!listing || listing.quantity < item.cartQuantity) {
      throw new HandleERROR(
        `Insufficient stock for product ${item.productId}`,
        400,
      );
    }

    return {
      listingId: listing._id,
      sellerId: listing.sellerId,
      productId: listing.productId,
      productVariantId: listing.productVariantId,
      quantity: item.cartQuantity,
      price: listing.price,
      totalPrice: listing.price * item.cartQuantity,
    };
  });

  const totalPrice = orderItems.reduce(
    (total, item) => total + item.totalPrice,
    0,
  );

  let discount = null;
  let discountAmount = 0;

  if (discountCode) {
    discount = await Discount.findOne({
      code: discountCode.trim().toUpperCase(),
    });

    if (!discount) {
      return next(new HandleERROR("Discount code not found", 404));
    }

    const check = checkCode(discount, totalPrice, req.userId);

    if (!check.success) {
      return next(new HandleERROR(check.message, 400));
    }

    discountAmount =
      discount.discountType === "amount"
        ? discount.value
        : (totalPrice * discount.value) / 100;

    if (discount.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }

    discountAmount = Math.min(discountAmount, totalPrice);
  }

  const finalPrice = totalPrice - discountAmount;

  const order = await Order.create({
    userId: req.userId,
    discountId: discount?._id || null,
    items: orderItems,
    address: address.toObject(),
    totalPrice,
    totalDiscount: discountAmount,
    finalPrice,
    status: "pending",
  });

  const paymentRecord = await Payment.create({
    orderId: order._id,
    userId: req.userId,
    amount: finalPrice,
    gateway: "zarinpal",
    status: "pending",
  });

  const paymentResponse = await createPayment(
    finalPrice,
    `Payment for order ${order._id}`,
    order._id,
  );

  if (paymentResponse.data?.code !== 100) {
    paymentRecord.status = "failed";
    paymentRecord.errorMessage =
      paymentResponse.errors?.message || "Payment request failed";

    await paymentRecord.save();

    return next(
      new HandleERROR("Could not create payment gateway request", 400),
    );
  }

  paymentRecord.authority = paymentResponse.data.authority;
  await paymentRecord.save();

  return res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      paymentId: paymentRecord._id,
      paymentUrl: `${ZARINPAL.GATEWAY}${paymentRecord.authority}`,
    },
    message: "Payment request created successfully",
  });
});

export const callBackPayment = catchAsync(async (req, res, next) => {
  const { orderId, Authority, Status } = req.query;

  if (!orderId || !Authority) {
    return next(new HandleERROR("Invalid payment callback", 400));
  }

  const paymentRecord = await Payment.findOne({
    orderId,
    authority: Authority,
  });

  if (!paymentRecord) {
    return next(new HandleERROR("Payment not found", 404));
  }

  if (paymentRecord.status === "success") {
    return res.status(200).json({
      success: true,
      message: "Payment was already processed",
    });
  }

  if (Status !== "OK") {
    paymentRecord.status = "failed";
    paymentRecord.errorMessage = "Payment was cancelled or unsuccessful";
    await paymentRecord.save();

    return res.status(200).json({
      success: false,
      message: "Payment was not completed",
    });
  }

  const verificationResponse = await verifyPayment(
    paymentRecord.amount,
    Authority,
  );

  const verificationCode = verificationResponse.data?.code;

  if (verificationCode !== 100 && verificationCode !== 101) {
    paymentRecord.status = "failed";
    paymentRecord.errorMessage =
      verificationResponse.errors?.message || "Payment verification failed";

    await paymentRecord.save();

    return res.status(200).json({
      success: false,
      message: "Payment verification failed",
    });
  }

  const session = await mongoose.startSession();

  let alreadyProcessed = false;

  try {
    await session.withTransaction(async () => {
      const currentPayment = await Payment.findOne({
        _id: paymentRecord._id,
        status: { $ne: "success" },
      }).session(session);

      if (!currentPayment) {
        alreadyProcessed = true;
        return;
      }

      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      const sellerShipments = new Map();

      for (const item of order.items) {
        const updatedListing = await ProductListing.findOneAndUpdate(
          {
            _id: item.listingId,
            isPublished: true,
            quantity: { $gte: item.quantity },
          },
          {
            $inc: { quantity: -item.quantity },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedListing) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const sellerId = item.sellerId.toString();

        if (!sellerShipments.has(sellerId)) {
          sellerShipments.set(sellerId, {
            orderId: order._id,
            sellerId: item.sellerId,
            items: [],
            shippingMethod: "standard",
          });
        }

        sellerShipments.get(sellerId).items.push(item);
      }

      const shipments = [...sellerShipments.values()];

      await Shipment.create(shipments, { session });

      await Payment.updateOne(
        { _id: currentPayment._id },
        {
          $set: {
            status: "success",
            refId: String(verificationResponse.data.ref_id),
            paymentDate: new Date(),
            errorMessage: "",
          },
        },
        { session },
      );

      await Order.updateOne(
        { _id: order._id },
        {
          $set: { status: "processing" },
        },
        { session },
      );

      if (order.discountId) {
        await Discount.updateOne(
          { _id: order.discountId },
          {
            $addToSet: { userIdsUsed: order.userId },
          },
          { session },
        );
      }

      await Cart.updateOne(
        { userId: order.userId },
        {
          $set: {
            items: [],
            totalPrice: 0,
            totalPriceAfterDiscount: 0,
          },
        },
        { session },
      );
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_STOCK") {
      await Payment.findByIdAndUpdate(paymentRecord._id, {
        $set: {
          status: "success",
          refId: String(verificationResponse.data.ref_id),
          paymentDate: new Date(),
          errorMessage:
            "Payment succeeded but stock is unavailable. Refund is required.",
        },
      });

      await Order.findByIdAndUpdate(orderId, {
        $set: { status: "cancelled" },
      });

      return res.status(200).json({
        success: false,
        message:
          "Payment succeeded but products are unavailable. Refund is required.",
      });
    }

    return next(error);
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    data: {
      orderId,
      paymentId: paymentRecord._id,
      alreadyProcessed,
    },
    message: "Payment completed successfully",
  });
});
