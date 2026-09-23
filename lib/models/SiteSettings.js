import mongoose, { Schema } from "mongoose";

const siteSettingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: "company" },
    companyName: { type: String, default: "SmartEprint Services" },
    email: { type: String, default: "support@smarteprintservices.com" },
    phone: { type: String, default: "" },
    website: { type: String, default: "https://smarteprintservices.com" },
    address: { type: String, default: "" },
    description: { type: String, default: "" },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);
