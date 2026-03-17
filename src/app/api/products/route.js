import { connectDB } from "@/app/lib/db";
import Product from "@/app/model/product";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const product = await new Product(body).save();

    return NextResponse.json(
      { message: "Saved", data: product },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  await connectDB();

  const data = await Product.find().sort({ createdAt: -1 });

  return NextResponse.json(data);
}