const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
});

const categoryReferenceSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  subcategory: {
    group: { type: String, required: true },
    item: { type: String, required: true },
  },
});

const ProductSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [imageSchema],
    categoryDetails: categoryReferenceSchema,
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    warranty: {
      type: String,
      enum: ["", "1 year", "2 years", "3 years", "lifetime"],
      default: "",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductTag" }],
    activePromotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Product", ProductSchema);