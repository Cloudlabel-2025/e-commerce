import { connectDB } from "@/app/lib/db";
import Product from "@/app/model/product";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { comparisons } = await req.json();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ message: "Not found" }, { status: 404 });

    product.comparisons = comparisons;
    await product.save();

    return NextResponse.json({ message: "Updated", data: product });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
