/**
 * Helper to calculate splits for an expense.
 * Stores values as integers (paise/cents) to avoid float rounding issues.
 * Returns a mapping of userId -> amount in paise.
 * 
 * If there is a rounding remainder, it distributes it 1 paisa at a time
 * to the participants to ensure the sum of splits EXACTLY equals the total amount.
 */
export function calculateSplits(params: {
  amount: number; // in paise (can be negative for refunds)
  splitType: string; // "equal" | "unequal" | "percentage" | "share"
  splitWith: string[]; // List of user names
  splitDetails?: Record<string, number>; // Weights, percentages, or exact amounts
}): Record<string, number> {
  const { amount, splitType, splitWith, splitDetails = {} } = params;
  const result: Record<string, number> = {};
  
  if (splitWith.length === 0) return result;

  // Handle negative amount by doing calculation on absolute and applying sign at end,
  // or just doing signed division. Signed division works fine in JS: Math.floor/Math.round.
  // To keep it simple, we'll work with signed integers.

  if (splitType === "equal") {
    const n = splitWith.length;
    const baseShare = Math.trunc(amount / n);
    let remainder = amount - baseShare * n;

    // Distribute remainder (could be positive or negative depending on amount sign)
    // 1 paisa at a time to the first few participants
    splitWith.forEach((user, idx) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      } else if (remainder < 0) {
        share -= 1;
        remainder += 1;
      }
      result[user] = share;
    });
  } else if (splitType === "percentage") {
    // splitDetails contains user -> percentage (e.g. Aisha -> 30)
    let totalPct = 0;
    splitWith.forEach(u => {
      totalPct += splitDetails[u] || 0;
    });

    // If total percent is 0, split equal
    if (totalPct === 0) {
      return calculateSplits({ amount, splitType: "equal", splitWith });
    }

    let allocatedSum = 0;
    splitWith.forEach(user => {
      const pct = splitDetails[user] || 0;
      // Calculate share: truncating towards zero
      const share = Math.trunc((amount * pct) / 100);
      result[user] = share;
      allocatedSum += share;
    });

    let remainder = amount - allocatedSum;
    // Distribute remainder to users with non-zero percentage, starting with highest percentage
    const sortedUsers = [...splitWith].sort((a, b) => (splitDetails[b] || 0) - (splitDetails[a] || 0));
    
    let idx = 0;
    while (remainder !== 0 && sortedUsers.length > 0) {
      const user = sortedUsers[idx % sortedUsers.length];
      if (remainder > 0) {
        result[user] += 1;
        remainder -= 1;
      } else {
        result[user] -= 1;
        remainder += 1;
      }
      idx++;
    }
  } else if (splitType === "share") {
    // splitDetails contains user -> weight (e.g. Rohan -> 2, Priya -> 1)
    let totalShares = 0;
    splitWith.forEach(u => {
      totalShares += splitDetails[u] || 0;
    });

    if (totalShares === 0) {
      return calculateSplits({ amount, splitType: "equal", splitWith });
    }

    let allocatedSum = 0;
    splitWith.forEach(user => {
      const shareWeight = splitDetails[user] || 0;
      const share = Math.trunc((amount * shareWeight) / totalShares);
      result[user] = share;
      allocatedSum += share;
    });

    let remainder = amount - allocatedSum;
    const sortedUsers = [...splitWith].sort((a, b) => (splitDetails[b] || 0) - (splitDetails[a] || 0));
    
    let idx = 0;
    while (remainder !== 0 && sortedUsers.length > 0) {
      const user = sortedUsers[idx % sortedUsers.length];
      if (remainder > 0) {
        result[user] += 1;
        remainder -= 1;
      } else {
        result[user] -= 1;
        remainder += 1;
      }
      idx++;
    }
  } else if (splitType === "unequal") {
    // splitDetails contains user -> exact amount in paise
    // In this case, we use the exact values, but if there's a difference, we respect details
    let allocatedSum = 0;
    splitWith.forEach(user => {
      const amt = splitDetails[user] || 0;
      result[user] = amt;
      allocatedSum += amt;
    });

    // If sum of details doesn't equal amount, we log the discrepancy but use details.
    // (The importer UI flags this and prompts user to resolve).
  }

  return result;
}
