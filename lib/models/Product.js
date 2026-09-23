import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    source: { type: String, enum: ["admin"], default: "admin", index: true },
    category: { type: String, required: true, default: "all" },
    technology: { type: String, default: "" },
    usageCategory: { type: String, default: "" },
    allInOneType: { type: String, default: "" },
    wireless: { type: String, default: "" },
    mainFunction: { type: String, default: "" },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    countInStock: { type: Number, default: 15 },
    inStock: { type: Boolean, default: true },
    badge: { type: String, default: "" },
    image: { type: String, default: "" },
    images: [{ type: String }],
    shortDesc: { type: String, default: "" },
    overview: { type: String, default: "" },
    features: [{ type: String }],
    highlights: { type: String, default: "" },
    keywords: [{ type: String }],
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    technicalSpecificationRows: [
      {
        label: { type: String, default: "" },
        value: { type: String, default: "" },
      },
    ],
    reviews: [
      {
        author: { type: String, default: "" },
        rating: { type: Number, default: 5 },
        text: { type: String, default: "" },
      },
    ],
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 24 },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ createdAt: -1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
