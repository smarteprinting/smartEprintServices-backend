import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.CLOVER_PUBLIC_KEY || !process.env.CLOVER_MERCHANT_ID) {
    return NextResponse.json({ success: false, message: "Card payments are not configured." }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    publicKey: process.env.CLOVER_PUBLIC_KEY,
    merchantId: process.env.CLOVER_MERCHANT_ID,
    environment: process.env.CLOVER_ENV === "production" ? "production" : "sandbox",
  });
}
