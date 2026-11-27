
import { catchAsync, HandleERROR } from "vanta-api";
import Product from "../Models/ProductMd.js";
import Category from "../Models/CategoryMd.js";
import Brand from "../Models/BrandMd.js";

export const Search = catchAsync(async (req, res, next) => {
  const {
    keyword,
    type = "nav",
    page = 1,
    limit = 5,
    sort = "-createdAt",
  } = req.query;

  if (!keyword || !keyword.trim()) {
    return next(new HandleERROR("Keyword is required", 400));
  }

  const isAdmin = req.role === "admin" || req.role === "superAdmin";

  const searchFilter = {
    title: { $regex: keyword.trim(), $options: "i" },
  };

  const visibilityFilter = isAdmin ? {} : { isPublished: true };

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitPage = Math.max(Number(limit) || 5, 1);
  const skipPage = (pageNum - 1) * limitPage;

  if (type === "nav") {
    const [products, categories, brands] = await Promise.all([
      Product.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .limit(5),
      Category.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .limit(5),
      Brand.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .limit(5),
    ]);

    if (!products.length && !categories.length && !brands.length) {
      return next(new HandleERROR("No results found", 404));
    }

    return res.status(200).json({
      success: true,
      data: { products, categories, brands },
    });
  }

  const models = {
    products: Product,
    categories: Category,
    brands: Brand,
  };

  if (type === "all") {
    const [products, categories, brands] = await Promise.all([
      Product.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .skip(skipPage)
        .limit(limitPage),
      Category.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .skip(skipPage)
        .limit(limitPage),
      Brand.find({ ...searchFilter, ...visibilityFilter })
        .sort(sort)
        .skip(skipPage)
        .limit(limitPage),
    ]);

    const [productsCount, categoriesCount, brandsCount] =
      await Promise.all([
        Product.countDocuments({ ...searchFilter, ...visibilityFilter }),
        Category.countDocuments({ ...searchFilter, ...visibilityFilter }),
        Brand.countDocuments({ ...searchFilter, ...visibilityFilter }),
      ]);

    if (!products.length && !categories.length && !brands.length) {
      return next(new HandleERROR("No results found", 404));
    }

    return res.status(200).json({
      success: true,
      results: products.length + categories.length + brands.length,
      data: { products, categories, brands },
      counts: {
        products: productsCount,
        categories: categoriesCount,
        brands: brandsCount,
      },
    });
  }

  if (!models[type]) {
    return next(new HandleERROR("Type invalid", 400));
  }

  const Model = models[type];

  const [data, count] = await Promise.all([
    Model.find({ ...searchFilter, ...visibilityFilter })
      .sort(sort)
      .skip(skipPage)
      .limit(limitPage),
    Model.countDocuments({ ...searchFilter, ...visibilityFilter }),
  ]);

  if (!data.length) {
    return next(new HandleERROR("No results found", 404));
  }

  return res.status(200).json({
    success: true,
    results: data.length,
    data,
    counts: count,
  });
});
