import db from "./db";

export interface AuditTrailEntry {
  expenseId: string;
  date: string;
  description: string;
  paidBy: string;
  totalAmount: number; // in paise
  currency: string;
  exchangeRate: number;
  userPaid: number; // in paise (what this user paid)
  userShare: number; // in paise (what this user owed)
  netContribution: number; // userPaid - userShare
  isSettlement: boolean;
}

export interface UserBalance {
  userId: string;
  name: string;
  totalPaid: number; // in paise
  totalOwed: number; // in paise
  netBalance: number; // in paise (totalPaid - totalOwed)
}

export interface SimplifiedDebt {
  fromUser: string;
  fromUserId: string;
  toUser: string;
  toUserId: string;
  amount: number; // in paise
}

export async function calculateGroupBalances(groupId: string) {
  // Load group members
  const members = await db.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });

  const memberMap: Record<string, string> = {}; // userId -> name
  members.forEach((m) => {
    memberMap[m.user.id] = m.user.name;
  });

  // Load all active expenses and their splits
  const expenses = await db.expense.findMany({
    where: { groupId, isActive: true },
    include: {
      splits: true,
      paidBy: true,
    },
    orderBy: { date: "asc" },
  });

  // Initialize balance map
  const balances: Record<string, UserBalance> = {};
  const auditTrails: Record<string, AuditTrailEntry[]> = {};

  members.forEach((m) => {
    balances[m.userId] = {
      userId: m.userId,
      name: m.user.name,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    };
    auditTrails[m.userId] = [];
  });

  // Process each expense to compile balances and audit trails
  expenses.forEach((expense) => {
    const paidById = expense.paidById;
    const expenseAmount = expense.amount; // already in INR paise

    // Audit entries for this expense
    // 1. Payer gets credit for paying
    if (balances[paidById]) {
      balances[paidById].totalPaid += expenseAmount;
    }

    // 2. Participants get charged for their share
    expense.splits.forEach((split) => {
      const splitUserId = split.userId;
      const splitAmount = split.amount; // in paise

      if (balances[splitUserId]) {
        balances[splitUserId].totalOwed += splitAmount;
      }
    });

    // Populate audit trail entries for everyone involved
    members.forEach((m) => {
      const userId = m.userId;
      const isPayer = paidById === userId;
      const splitEntry = expense.splits.find((s) => s.userId === userId);
      const isParticipant = !!splitEntry;

      // Only add to audit trail if they paid or participated
      if (isPayer || isParticipant) {
        const userPaid = isPayer ? expenseAmount : 0;
        const userShare = splitEntry ? splitEntry.amount : 0;
        const netContribution = userPaid - userShare;

        auditTrails[userId].push({
          expenseId: expense.id,
          date: expense.date.toISOString().split("T")[0],
          description: expense.description,
          paidBy: expense.paidBy.name,
          totalAmount: expenseAmount,
          currency: expense.currency,
          exchangeRate: expense.exchangeRate,
          userPaid,
          userShare,
          netContribution,
          isSettlement: expense.isSettlement,
        });
      }
    });
  });

  // Calculate net balances
  members.forEach((m) => {
    const b = balances[m.userId];
    b.netBalance = b.totalPaid - b.totalOwed;
  });

  // Debt simplification algorithm (Aisha's request)
  const debtors: { userId: string; name: string; amount: number }[] = [];
  const creditors: { userId: string; name: string; amount: number }[] = [];

  Object.values(balances).forEach((b) => {
    if (b.netBalance < 0) {
      debtors.push({ userId: b.userId, name: b.name, amount: -b.netBalance });
    } else if (b.netBalance > 0) {
      creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
    }
  });

  // Sort: Debtors ascending (most debt first), Creditors descending (owed most first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts: SimplifiedDebt[] = [];
  
  let i = 0; // Debtor index
  let j = 0; // Creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      simplifiedDebts.push({
        fromUserId: debtor.userId,
        fromUser: debtor.name,
        toUserId: creditor.userId,
        toUser: creditor.name,
        amount: transferAmount,
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
    }

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return {
    balances: Object.values(balances),
    simplifiedDebts,
    auditTrails,
  };
}
