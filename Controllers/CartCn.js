import { catchAsync, HandleERROR } from "vanta-api";
import Cart from "../Models/CartMd.js";
import ProductListing from "../Models/ProductListingMd.js";

const updateCartTotals = (cart) => {
  cart.totalPrice = cart.items.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0,
  );

  cart.totalPriceAfterDiscount = cart.items.reduce(
    (total, item) => total + item.priceAfterDiscount * item.cartQuantity,
    0,
  );
};

export const clear = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { userId: req.userId },
    {
      items: [],
      totalPrice: 0,
      totalPriceAfterDiscount: 0,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(200).json({
    success: true,
    data: cart,
    message: "Cart cleared successfully",
  });
});

export const getOne = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ userId: req.userId }).populate([
    {
      path: "items.productId",
      select: "title images isPublished",
    },
    {
      path: "items.listingId",
      populate: [
        {
          path: "productId",
          select: "title images isPublished",
        },
        {
          path: "sellerId",
          select: "storeName status",
        },
      ],
    },
    {
      path: "items.productVariantId",
      populate: {
        path: "variants",
        populate: {
          path: "attributeId",
        },
      },
    },
  ]);

  if (!cart) {
    cart = await Cart.create({ userId: req.userId });
  }

  let cartChanged = false;

  cart.items = cart.items.filter((item) => {
    const listing = item.listingId;
    const product = listing?.productId;
    const seller = listing?.sellerId;

    if (
      !listing ||
      !product ||
      !listing.isPublished ||
      !product.isPublished ||
      !seller ||
      seller.status !== "active" ||
      listing.quantity <= 0
    ) {
      cartChanged = true;
      return false;
    }

    if (item.cartQuantity > listing.quantity) {
      item.cartQuantity = listing.quantity;
      cartChanged = true;
    }

    if (
      item.price !== listing.price ||
      item.priceAfterDiscount !== listing.price
    ) {
      item.price = listing.price;
      item.priceAfterDiscount = listing.price;
      cartChanged = true;
    }

    return true;
  });

  const oldTotalPrice = cart.totalPrice;
  const oldTotalPriceAfterDiscount = cart.totalPriceAfterDiscount;

  updateCartTotals(cart);

  if (
    oldTotalPrice !== cart.totalPrice ||
    oldTotalPriceAfterDiscount !== cart.totalPriceAfterDiscount
  ) {
    cartChanged = true;
  }

  if (cartChanged) {
    await cart.save();
  }

  return res.status(200).json({
    success: true,
    data: cart,
    message: cartChanged
      ? "Cart items and prices have been updated"
      : "Cart retrieved successfully",
  });
});

export const addItem = catchAsync(async (req, res, next) => {
  const { listingId } = req.body;

  if (!listingId) {
    return next(new HandleERROR("Listing ID is required", 400));
  }

  const listing = await ProductListing.findById(listingId).populate([
    {
      path: "productId",
      select: "title isPublished",
    },
    {
      path: "sellerId",
      select: "status",
    },
  ]);

  if (!listing) {
    return next(new HandleERROR("Product listing not found", 404));
  }

  if (
    !listing.isPublished ||
    !listing.productId ||
    !listing.productId.isPublished ||
    !listing.sellerId ||
    listing.sellerId.status !== "active"
  ) {
    return next(new HandleERROR("Product listing is not available", 400));
  }

  if (listing.quantity <= 0) {
    return next(new HandleERROR("Product is out of stock", 400));
  }

  let cart = await Cart.findOne({ userId: req.userId });

  if (!cart) {
    cart = await Cart.create({ userId: req.userId });
  }

  const existingItem = cart.items.find(
    (item) => item.listingId.toString() === listingId,
  );

  if (existingItem) {
    if (existingItem.cartQuantity >= listing.quantity) {
      return next(new HandleERROR("Maximum available quantity reached", 400));
    }

    existingItem.cartQuantity += 1;
  } else {
    cart.items.push({
      productId: listing.productId._id,
      listingId: listing._id,
      productVariantId: listing.productVariantId || null,
      cartQuantity: 1,
      price: listing.price,
      priceAfterDiscount: listing.price,
    });
  }

  updateCartTotals(cart);

  await cart.save();

  return res.status(200).json({
    success: true,
    data: cart,
    message: "Item added to cart successfully",
  });
});

export const removeItem = catchAsync(async (req, res, next) => {
  const { listingId } = req.body;

  if (!listingId) {
    return next(new HandleERROR("Listing ID is required", 400));
  }

  const cart = await Cart.findOne({ userId: req.userId });

  if (!cart) {
    return next(new HandleERROR("Cart not found", 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.listingId.toString() === listingId,
  );

  if (itemIndex === -1) {
    return next(new HandleERROR("Item not found in cart", 404));
  }

  const item = cart.items[itemIndex];

  item.cartQuantity -= 1;

  if (item.cartQuantity === 0) {
    cart.items.splice(itemIndex, 1);
  }

  updateCartTotals(cart);

  await cart.save();

  return res.status(200).json({
    success: true,
    data: cart,
    message: "Item removed from cart successfully",
  });
});
