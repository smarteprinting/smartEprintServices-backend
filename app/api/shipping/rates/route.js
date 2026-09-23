import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.EASYPOST_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, message: "Shipping service is not configured." }, { status: 503 });
    const fromAddress = {
      name: process.env.SHIPPING_FROM_NAME || "SmartEprint Services",
      street1: process.env.SHIPPING_FROM_STREET,
      city: process.env.SHIPPING_FROM_CITY,
      state: process.env.SHIPPING_FROM_STATE,
      zip: process.env.SHIPPING_FROM_ZIP,
    };
    if (!fromAddress.street1 || !fromAddress.city || !fromAddress.state || !fromAddress.zip) {
      return NextResponse.json({ success: false, message: "Shipping origin is not configured." }, { status: 503 });
    }
    const { name, street1, city, state, zip, country = "US" } = await request.json();
    if (!street1 || !city || !state || !zip) return NextResponse.json({ success: false, message: "A complete delivery address is required." }, { status: 400 });

    const response = await fetch("https://api.easypost.com/v2/shipments", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment: { from_address: { ...fromAddress, country }, to_address: { name, street1, city, state, zip, country }, parcel: { length: 12, width: 10, height: 8, weight: 160 } } }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ success: false, message: data.error?.message || "Unable to calculate shipping." }, { status: 502 });
    return NextResponse.json({ success: true, shipmentId: data.id, rates: (data.rates || []).map((rate) => ({ id: rate.id, carrier: rate.carrier, service: rate.service, amount: Number(rate.rate), currency: rate.currency, deliveryDays: rate.delivery_days })) });
  } catch (error) {
    console.error("EasyPost rates error:", error);
    return NextResponse.json({ success: false, message: "Unable to calculate shipping right now." }, { status: 502 });
  }
}