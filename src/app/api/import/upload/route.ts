import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { parseAndAnalyzeCSV } from "@/lib/importer";

export async function POST(req: NextRequest) {
  try {
    const { csvContent, filename } = await req.json();

    if (!csvContent) {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    // Run parser & anomaly detection
    const parsedRows = parseAndAnalyzeCSV(csvContent);

    // Create a new ImportSession in DB
    const session = await db.importSession.create({
      data: {
        filename: filename || "expenses_export.csv",
        status: "pending",
      },
    });

    // Save each parsed row in ImportRow
    const importRowsData = parsedRows.map((row) => ({
      sessionId: session.id,
      rowNumber: row.rowNumber,
      rawLine: row.rawRow.rawLine,
      status: row.status,
      date: row.rawRow.date,
      description: row.rawRow.description,
      paidBy: row.rawRow.paidBy,
      amount: row.rawRow.amount,
      currency: row.rawRow.currency,
      splitType: row.rawRow.splitType,
      splitWith: row.rawRow.splitWith,
      splitDetails: row.rawRow.splitDetails,
      notes: row.rawRow.notes,
      anomalies: JSON.stringify(row.anomalies),
      resolutionAction: JSON.stringify({ action: "approve" }), // Default proposed action
      resolvedData: JSON.stringify(row.proposedData),
    }));

    // Insert all in transaction
    await db.$transaction(
      importRowsData.map((data) =>
        db.importRow.create({
          data,
        })
      )
    );

    // Fetch created rows to return
    const rows = await db.importRow.findMany({
      where: { sessionId: session.id },
      orderBy: { rowNumber: "asc" },
    });

    return NextResponse.json({
      sessionId: session.id,
      filename: session.filename,
      status: session.status,
      createdAt: session.createdAt,
      rows: rows.map((r) => ({
        ...r,
        anomalies: JSON.parse(r.anomalies),
        resolvedData: JSON.parse(r.resolvedData || "{}"),
      })),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload and analyze CSV file: " + error.message },
      { status: 500 }
    );
  }
}
