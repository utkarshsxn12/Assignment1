import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { calculateSplits } from "@/lib/splits";

// Fetch all active group expenses
export async function GET(req: NextRequest) {
  try {
    const groupId = "flatmates-group-id"; // Default group
    const expenses = await db.expense.findMany({
      where: { groupId, isActive: true },
      include: {
        paidBy: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses: " + error.message }, { status: 500 });
  }
}

// Create a new expense with splits
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      description,
      amount, // in rupees
      currency = "INR",
      exchangeRate = 1.0,
      splitType,
      paidById,
      date,
      splitWith, // Array of User IDs
      splitDetails = {}, // Record of User ID -> weight/percentage/amount
      notes = "",
      isSettlement = false,
    } = body;

    if (!description || !amount || !splitType || !paidById || !date || !splitWith || splitWith.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const groupId = "flatmates-group-id";
    const expDate = new Date(date);

    // Load users to get their names (required for calculateSplits which uses names)
    const users = await db.user.findMany({
      where: { id: { in: [paidById, ...splitWith] } },
    });

    const userMap: Record<string, string> = {}; // ID -> name
    const userNameMap: Record<string, string> = {}; // name -> ID
    users.forEach((u) => {
      userMap[u.id] = u.name;
      userNameMap[u.name] = u.id;
    });

    const amountInPaise = Math.round(amount * 100);
    const amountInInr = Math.round(amountInPaise * exchangeRate);

    // Translate splitWith and splitDetails to names for calculateSplits
    const splitWithNames = splitWith.map((id: string) => userMap[id]).filter(Boolean);
    const splitDetailsNames: Record<string, number> = {};
    for (const [id, val] of Object.entries(splitDetails)) {
      const name = userMap[id];
      if (name) {
        // If unequal split, convert input rupees to paise
        splitDetailsNames[name] = splitType === "unequal" ? Math.round((val as number) * 100) : (val as number);
      }
    }

    // Run Split calculation
    const computedSplitsNames = calculateSplits({
      amount: amountInInr,
      splitType,
      splitWith: splitWithNames,
      splitDetails: splitDetailsNames,
    });

    // Write to DB inside transaction
    const expense = await db.$transaction(async (tx) => {
      // 1. Create Expense
      const exp = await tx.expense.create({
        data: {
          groupId,
          description,
          amount: amountInInr,
          currency,
          exchangeRate,
          splitType,
          date: expDate,
          paidById,
          notes,
          isSettlement,
        },
      });

      // 2. Create splits
      for (const [name, share] of Object.entries(computedSplitsNames)) {
        const userId = userNameMap[name];
        if (userId) {
          await tx.expenseSplit.create({
            data: {
              expenseId: exp.id,
              userId,
              amount: share,
              shareValue: splitDetails[userId] || null,
              percentageValue: splitDetails[userId] || null,
            },
          });
        }
      }

      return exp;
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense: " + error.message }, { status: 500 });
  }
}
