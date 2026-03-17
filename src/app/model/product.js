import mongoose from "mongoose";

const comparisonSchema = new mongoose.Schema({
  competitorProductName: { type: String, required: true },
  competitorPrice: { type: Number, required: true },
  brandName: { type: String },
  platform: { type: String },
  priceDifference: { type: Number },
});

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    Quantity: { type: String, required: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    profitMargin: { type: Number, required: true },

    comparisons: [comparisonSchema],
  },
  { timestamps: true }
);

productSchema.pre("save", async function () {
  this.comparisons.forEach((item) => {
    item.priceDifference = this.sellingPrice - item.competitorPrice;
  });
});

delete mongoose.models.Product;
export default mongoose.model("Product", productSchema);