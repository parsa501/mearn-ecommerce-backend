import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import morgan from "morgan";
import { catchError, HandleERROR } from "vanta-api";
import uploadRouter from "./Routes/Upload.js";
import exportToken from "./Middlewares/ExportToken.js";
import userRouter from "./Routes/User.js";
import authRouter from "./Routes/Auth.js";
import sellerApplicationRouter from "./Routes/SellerApplication.js";
import sellerProfileRouter from "./Routes/SellerProfile.js";
import addressRouter from "./Routes/Address.js";
import productRouter from "./Routes/Product.js";
import attributeRouter from "./Routes/Attribute.js";
import productVariantRouter from "./Routes/ProductVariant.js";
import variantRouter from "./Routes/Variant.js";
import productListingRouter from "./Routes/ProductListing.js";
import collectionRouter from "./Routes/Collection.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use("/uploads", express.static("Public/Uploads"));
app.use(exportToken);

app.use("/api/upload", uploadRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/seller-applications", sellerApplicationRouter);
app.use("/api/seller-profiles", sellerProfileRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/products", productRouter);
app.use("/api/attributes", attributeRouter);
app.use("/api/product-variants", productVariantRouter);
app.use("/api/variants", variantRouter);
app.use("/api/product-listings", productListingRouter);
app.use("/api/collections", collectionRouter);
app.use((req, res, next) => {
  return next(new HandleERROR("Not Found", 404));
});
app.use(catchError);
export default app;
