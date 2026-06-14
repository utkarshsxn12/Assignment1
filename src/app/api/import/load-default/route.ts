import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const csvPath = path.resolve(process.cwd(), "expenses_export.csv");
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "expenses_export.csv not found in root" }, { status: 404 });
    }
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    return NextResponse.json({ csvContent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
