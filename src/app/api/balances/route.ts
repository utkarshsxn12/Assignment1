import { NextResponse } from "next/server";
import { calculateGroupBalances } from "@/lib/balances";

export async function GET() {
  try {
    const groupId = "flatmates-group-id"; // Default seeded group
    const data = await calculateGroupBalances(groupId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Balances API error:", error);
    return NextResponse.json({ error: "Failed to fetch balances: " + error.message }, { status: 500 });
  }
}
