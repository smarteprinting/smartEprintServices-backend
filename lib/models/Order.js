import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
        name: String,
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    total: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    setupFee: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["card", "paypal", "delivery"], default: "delivery" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentReference: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
    trackingNumber: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    shippingCity: { type: String, default: "" },
    shippingState: { type: String, default: "" },
    shippingZipCode: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
