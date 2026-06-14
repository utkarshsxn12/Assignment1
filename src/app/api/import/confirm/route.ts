import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { calculateSplits } from "@/lib/splits";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, resolutions } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
    }

    const session = await db.importSession.findUnique({
      where: { id: sessionId },
      include: { rows: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Import session not found" }, { status: 404 });
    }

    if (session.status === "completed") {
      return NextResponse.json({ error: "This session has already been imported" }, { status: 400 });
    }

    // Default Group ID (from seed)
    const groupId = "flatmates-group-id";
    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: "Default group not found. Run seed script first." }, { status: 500 });
    }

    // Load all users to map names to IDs
    const users = await db.user.findMany();
    const userMap: Record<string, string> = {}; // Name lowercase -> ID
    users.forEach((u) => {
      userMap[u.name.toLowerCase()] = u.id;
    });

    const anomaliesReport: any[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // We will run this inside a Prisma transaction
    await db.$transaction(async (tx) => {
      for (const row of session.rows) {
        const rowResolution = resolutions[row.id] || { action: "import" };
        const action = rowResolution.action;

        if (action === "skip") {
          // Update row status
          await tx.importRow.update({
            where: { id: row.id },
            data: {
              status: "ignored",
              resolutionAction: JSON.stringify({ action: "skip", reason: "User chose to skip" }),
            },
          });
          skippedCount++;
          anomaliesReport.push({
            rowNumber: row.rowNumber,
            description: row.description,
            anomalies: JSON.parse(row.anomalies),
            actionTaken: "Skipped / Ignored",
          });
          continue;
        }

        // Use resolved data from staging database or manual edit
        const resolved = rowResolution.resolvedData || JSON.parse(row.resolvedData || "{}");

        // Parse date
        const expDate = resolved.date ? new Date(resolved.date) : new Date();

        // Find Payer User ID
        const payerNameNormalized = resolved.paidBy.toLowerCase();
        let paidById = userMap[payerNameNormalized];

        if (!paidById) {
          // If payer doesn't exist, check database or create
          let dbUser = await tx.user.findUnique({ where: { name: resolved.paidBy } });
          if (!dbUser) {
            dbUser = await tx.user.create({
              data: { name: resolved.paidBy, email: `${resolved.paidBy.toLowerCase()}@example.com` },
            });
            userMap[dbUser.name.toLowerCase()] = dbUser.id;
          }
          paidById = dbUser.id;
        }

        // Calculate converted amount in INR
        const exchangeRate = resolved.exchangeRate || 1.0;
        const baseAmount = resolved.amount; // in paise
        // Converted amount is rounded to nearest paise
        const amountInInr = Math.round(baseAmount * exchangeRate);

        // Create the Expense
        const expense = await tx.expense.create({
          data: {
            groupId,
            description: resolved.description,
            amount: amountInInr,
            currency: resolved.currency,
            exchangeRate,
            splitType: resolved.splitType,
            date: expDate,
            paidById,
            notes: resolved.notes,
            isSettlement: resolved.isSettlement || false,
          },
        });

        // Calculate Splits
        // Calculate splits returns: Record<ParticipantName, ShareInPaise>
        const rawSplits = calculateSplits({
          amount: amountInInr,
          splitType: resolved.splitType,
          splitWith: resolved.splitWith,
          splitDetails: resolved.splitDetails,
        });

        // Insert Splits into database
        for (const [pName, pShare] of Object.entries(rawSplits)) {
          let participantId = userMap[pName.toLowerCase()];

          // Handle Kabir / Host assignment rule
          // If name is "Kabir" or "Dev's friend Kabir" and not in db, attribute to Dev!
          if (!participantId && (pName.toLowerCase().includes("kabir") || pName.toLowerCase().includes("friend"))) {
            participantId = userMap["dev"]; // Attribute to Dev
          }

          if (!participantId) {
            // Find or create participant
            let dbUser = await tx.user.findUnique({ where: { name: pName } });
            if (!dbUser) {
              dbUser = await tx.user.create({
                data: { name: pName, email: `${pName.toLowerCase()}@example.com` },
              });
              userMap[dbUser.name.toLowerCase()] = dbUser.id;
            }
            participantId = dbUser.id;
          }

          // If the split is a settlement, we handle it as a direct debt transfer
          // Let's create the split entry
          // If participant is already in splits (e.g. if Dev guest Kabir got merged into Dev),
          // we should add the amounts together!
          const existingSplit = await tx.expenseSplit.findFirst({
            where: {
              expenseId: expense.id,
              userId: participantId,
            },
          });

          if (existingSplit) {
            await tx.expenseSplit.update({
              where: { id: existingSplit.id },
              data: { amount: existingSplit.amount + pShare },
            });
          } else {
            await tx.expenseSplit.create({
              data: {
                expenseId: expense.id,
                userId: participantId,
                amount: pShare,
                shareValue: resolved.splitDetails ? resolved.splitDetails[pName] : null,
                percentageValue: resolved.splitDetails ? resolved.splitDetails[pName] : null,
              },
            });
          }
        }

        // Update ImportRow status to imported
        await tx.importRow.update({
          where: { id: row.id },
          data: {
            status: "imported",
            resolutionAction: JSON.stringify({ action: "import", exchangeRate }),
          },
        });

        importedCount++;
        anomaliesReport.push({
          rowNumber: row.rowNumber,
          description: row.description,
          anomalies: JSON.parse(row.anomalies),
          actionTaken: `Imported (Payer: ${resolved.paidBy}, Amount: ${resolved.currency} ${(resolved.amount / 100).toFixed(2)}, Split: ${resolved.splitType})`,
        });
      }

      // Update Session Status
      await tx.importSession.update({
        where: { id: sessionId },
        data: { status: "completed" },
      });
    }, {
      timeout: 30000 // 30 seconds to allow remote database network latency
    });

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      report: anomaliesReport,
    });
  } catch (error: any) {
    console.error("Confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm and import staging rows: " + error.message },
      { status: 500 }
    );
  }
}
