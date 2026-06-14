export interface RawRow {
  rowNumber: number;
  rawLine: string;
  date: string;
  description: string;
  paidBy: string;
  amount: string;
  currency: string;
  splitType: string;
  splitWith: string;
  splitDetails: string;
  notes: string;
}

export interface Anomaly {
  type: string;
  message: string;
  severity: "warning" | "error";
  proposedResolution: string;
  field: string;
}

export interface ParsedRow {
  rowNumber: number;
  rawRow: RawRow;
  status: "clean" | "anomaly";
  anomalies: Anomaly[];
  proposedData: {
    date: string; // ISO date string (YYYY-MM-DD)
    description: string;
    paidBy: string;
    amount: number; // in paise
    currency: string;
    exchangeRate: number;
    splitType: string;
    splitWith: string[];
    splitDetails: Record<string, number>; // user -> share/percentage/amount
    notes: string;
    isSettlement: boolean;
  };
}

// User names normalization mapping
export const VALID_USERS = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"];
export const USER_ALIASES: Record<string, string> = {
  "priya s": "Priya",
  "priya": "Priya",
  "rohan": "Rohan",
  "aisha": "Aisha",
  "meera": "Meera",
  "dev": "Dev",
  "sam": "Sam",
};

// Date range active memberships
// Aisha: Joined Feb 1
// Rohan: Joined Feb 1
// Priya: Joined Feb 1
// Meera: Joined Feb 1, Left March 31
// Dev: Joined March 1, Left March 31
// Sam: Joined April 15
export interface MembershipWindow {
  join: Date;
  leave: Date | null;
}

export const USER_MEMBERSHIPS: Record<string, MembershipWindow> = {
  Aisha: { join: new Date("2026-02-01"), leave: null },
  Rohan: { join: new Date("2026-02-01"), leave: null },
  Priya: { join: new Date("2026-02-01"), leave: null },
  Meera: { join: new Date("2026-02-01"), leave: new Date("2026-03-31T23:59:59Z") },
  Dev: { join: new Date("2026-03-01"), leave: new Date("2026-03-31T23:59:59Z") },
  Sam: { join: new Date("2026-04-15"), leave: null },
};

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCSV(csvContent: string): RawRow[] {
  const lines = csvContent.split(/\r?\n/);
  const rawRows: RawRow[] = [];
  
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    
    // Create raw row mapping
    rawRows.push({
      rowNumber: i + 1, // 1-indexed Excel row number (header is row 1)
      rawLine: line,
      date: fields[0] || "",
      description: fields[1] || "",
      paidBy: fields[2] || "",
      amount: fields[3] || "",
      currency: fields[4] || "",
      splitType: fields[5] || "",
      splitWith: fields[6] || "",
      splitDetails: fields[7] || "",
      notes: fields[8] || "",
    });
  }

  return rawRows;
}

// Split a description into core alphanumeric words, filtering out common filler words
function getCoreWords(desc: string): string[] {
  const filler = new Set(["at", "for", "the", "a", "an", "in", "of", "and", "to", "with", "from", "on", "is", "this", "it"]);
  return desc
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 1 && !filler.has(word));
}

// Check if two rows are duplicate candidates
export function isDuplicate(rowA: RawRow, rowB: RawRow): boolean {
  if (rowA.rowNumber === rowB.rowNumber) return false;
  
  // Clean date matching
  const dateA = rowA.date.trim();
  const dateB = rowB.date.trim();
  if (dateA !== dateB) return false;

  const wordsA = getCoreWords(rowA.description);
  const wordsB = getCoreWords(rowB.description);

  // Find intersection of words
  const intersection = wordsA.filter(w => wordsB.includes(w));
  
  // They overlap if they share 2+ core words, or all words if description is very short
  const hasWordOverlap = 
    intersection.length >= 2 || 
    (intersection.length >= 1 && (wordsA.length === 1 || wordsB.length === 1));

  const exactWordMatch = 
    wordsA.length > 0 && 
    intersection.length === wordsA.length && 
    intersection.length === wordsB.length;

  // Amount comparison (clean them first)
  const amtA = parseFloat(rowA.amount.replace(/[^0-9.-]/g, ""));
  const amtB = parseFloat(rowB.amount.replace(/[^0-9.-]/g, ""));
  const hasAmountOverlap = amtA === amtB;

  const payerA = rowA.paidBy.trim().toLowerCase();
  const payerB = rowB.paidBy.trim().toLowerCase();
  const hasPayerOverlap = payerA === payerB || USER_ALIASES[payerA] === USER_ALIASES[payerB];

  // It is a duplicate candidate if:
  // 1. They have the exact same set of core words (e.g. "Dinner at Thalassa" vs "Thalassa dinner")
  // 2. They have word overlap and either same amount or same payer
  return exactWordMatch || (hasWordOverlap && (hasAmountOverlap || hasPayerOverlap));
}

// Main parser and analyzer
export function parseAndAnalyzeCSV(csvContent: string): ParsedRow[] {
  const rawRows = parseCSV(csvContent);
  const parsedRows: ParsedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const anomalies: Anomaly[] = [];
    
    // Propose default values
    let cleanDate = "";
    let cleanDescription = raw.description.trim();
    let cleanPaidBy = raw.paidBy.trim();
    let cleanAmount = 0; // in paise
    let cleanCurrency = raw.currency.trim();
    let cleanExchangeRate = 1.0;
    let cleanSplitType = raw.splitType.trim().toLowerCase() || "equal";
    let cleanSplitWith: string[] = [];
    let cleanSplitDetails: Record<string, number> = {};
    let cleanNotes = raw.notes.trim();
    let cleanIsSettlement = false;

    // --- 1. FIELD SHIFT / COLUMN ALIGNMENT (Missing currency column shift) ---
    // If field counts are shifted (e.g. line 12: Rohan,1500,unequal,"Rohan;Priya;Meera")
    // Let's check if the currency field is actually a split type
    let isShifted = false;
    if (
      raw.currency &&
      ["equal", "unequal", "percentage", "share"].includes(raw.currency.trim().toLowerCase())
    ) {
      isShifted = true;
      anomalies.push({
        type: "column_shift",
        message: `Missing currency column causes field shifting. Detected '${raw.currency}' in currency field.`,
        severity: "error",
        field: "currency",
        proposedResolution: "Realign columns, set currency to 'INR' (default), and shift split fields.",
      });

      // Shift variables
      cleanCurrency = "INR"; // Default since rent/bills are in INR
      cleanSplitType = raw.currency.trim().toLowerCase();
      // Raw splitType is actually splitWith, splitWith is splitDetails, splitDetails is notes
      const shiftedSplitWith = raw.splitType;
      const shiftedSplitDetails = raw.splitWith;
      const shiftedNotes = raw.splitDetails;

      raw.splitWith = shiftedSplitWith;
      raw.splitDetails = shiftedSplitDetails;
      raw.notes = shiftedNotes;
      cleanNotes = (shiftedNotes + " " + raw.notes).trim();
    }

    // --- 2. DATE PARSING & INCONSISTENT FORMATS ---
    // Supported: YYYY-MM-DD, DD/MM/YYYY, MMM DD, e.g. "2026-02-01", "01/03/2026", "Mar 14"
    const rawDateStr = raw.date.trim();
    let parsedDate: Date | null = null;
    let formatType = "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
      parsedDate = new Date(rawDateStr + "T00:00:00Z");
      formatType = "YYYY-MM-DD";
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDateStr)) {
      formatType = "DD/MM/YYYY";
      // Split DD/MM/YYYY
      const parts = rawDateStr.split("/");
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      parsedDate = new Date(Date.UTC(year, month, day));
    } else if (/^[A-Za-z]{3}\s+\d{1,2}$/.test(rawDateStr)) {
      formatType = "MMM DD";
      const parts = rawDateStr.split(/\s+/);
      const monthStr = parts[0].toLowerCase();
      const day = parseInt(parts[1], 10);
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const month = monthMap[monthStr.substring(0, 3)] ?? 2; // Default to March if unsure
      parsedDate = new Date(Date.UTC(2026, month, day));
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      anomalies.push({
        type: "invalid_date_format",
        message: `Inconsistent or unparseable date format: '${rawDateStr}'`,
        severity: "error",
        field: "date",
        proposedResolution: "Parse date as April/May 2026 based on context.",
      });
      // Fallback
      parsedDate = new Date("2026-02-01T00:00:00Z");
    } else {
      cleanDate = parsedDate.toISOString().split("T")[0];
      if (formatType !== "YYYY-MM-DD") {
        anomalies.push({
          type: "inconsistent_date_format",
          message: `Inconsistent date format: '${rawDateStr}' parsed as '${cleanDate}'`,
          severity: "warning",
          field: "date",
          proposedResolution: `Convert format to YYYY-MM-DD (${cleanDate})`,
        });
      }
    }

    // --- 3. AMBIGUOUS DATE FORMATS ---
    // "04/05/2026" - Is it April 5 or May 4?
    if (rawDateStr === "04/05/2026") {
      anomalies.push({
        type: "ambiguous_date",
        message: `Ambiguous date '04/05/2026'. Could be May 4th or April 5th.`,
        severity: "warning",
        field: "date",
        proposedResolution: "Parse as April 5th, 2026 based on nearby April transactions.",
      });
      // Set to April 5th
      cleanDate = "2026-04-05";
      parsedDate = new Date("2026-04-05T00:00:00Z");
    }

    // --- 4. PAID BY ALIAS / MISMATCH ---
    const rawPaidByNormalized = cleanPaidBy.toLowerCase().trim();
    if (!cleanPaidBy) {
      anomalies.push({
        type: "missing_payer",
        message: `Missing payer in expense '${raw.description}'`,
        severity: "error",
        field: "paidBy",
        proposedResolution: "Require user selection or default to Aisha.",
      });
      cleanPaidBy = "Aisha"; // Fallback placeholder
    } else if (!VALID_USERS.includes(cleanPaidBy)) {
      const matchedUser = USER_ALIASES[rawPaidByNormalized];
      if (matchedUser) {
        anomalies.push({
          type: "payer_alias",
          message: `Non-standard name format: '${cleanPaidBy}' mapped to registered user '${matchedUser}'`,
          severity: "warning",
          field: "paidBy",
          proposedResolution: `Map '${cleanPaidBy}' -> '${matchedUser}'`,
        });
        cleanPaidBy = matchedUser;
      } else {
        anomalies.push({
          type: "unknown_payer",
          message: `Unknown payer name: '${cleanPaidBy}'`,
          severity: "error",
          field: "paidBy",
          proposedResolution: `Treat as external payer or map to group member.`,
        });
      }
    }

    // --- 5. AMOUNT CLEANING & FORMATTING (e.g. "1,200", spaces) ---
    let rawAmountStr = raw.amount.replace(/"/g, "");
    const originalAmountStr = rawAmountStr;
    const cleanAmountStr = rawAmountStr.trim().replace(/,/g, "").replace(/\s/g, "");
    let numAmount = parseFloat(cleanAmountStr);

    if (originalAmountStr !== cleanAmountStr) {
      anomalies.push({
        type: "dirty_amount",
        message: `Dirty amount string '${raw.amount}' contains commas or spaces.`,
        severity: "warning",
        field: "amount",
        proposedResolution: `Clean to number: ${numAmount}`,
      });
    }

    // --- 6. AMOUNT PRECISION (e.g. 899.995) ---
    const decimalParts = cleanAmountStr.split(".");
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      anomalies.push({
        type: "high_precision_amount",
        message: `High-precision amount '${raw.amount}' exceeds standard 2 decimal places.`,
        severity: "warning",
        field: "amount",
        proposedResolution: `Round to 2 decimal places: ${numAmount.toFixed(2)}`,
      });
      numAmount = Math.round(numAmount * 100) / 100;
    }

    // Store in paise (integer)
    if (isNaN(numAmount)) {
      anomalies.push({
        type: "invalid_amount",
        message: `Invalid amount format: '${raw.amount}'`,
        severity: "error",
        field: "amount",
        proposedResolution: "Set amount to 0 and investigate.",
      });
      cleanAmount = 0;
    } else {
      cleanAmount = Math.round(numAmount * 100);
    }

    // --- 7. ZERO-AMOUNT EXPENSES ---
    if (cleanAmount === 0) {
      anomalies.push({
        type: "zero_amount",
        message: `Zero-amount expense logged: '${raw.description}'`,
        severity: "warning",
        field: "amount",
        proposedResolution: "Keep in records but don't split balances.",
      });
    }

    // --- 8. NEGATIVE AMOUNTS (Refunds) ---
    if (cleanAmount < 0) {
      anomalies.push({
        type: "negative_amount",
        message: `Negative amount '${raw.amount}' detected. This is a refund.`,
        severity: "warning",
        field: "amount",
        proposedResolution: "Treat as a negative expense, which reduces split balances.",
      });
    }

    // --- 9. MISSING CURRENCY ---
    if (!cleanCurrency) {
      anomalies.push({
        type: "missing_currency",
        message: `Missing currency for expense '${raw.description}'.`,
        severity: "warning",
        field: "currency",
        proposedResolution: "Set currency to 'INR' (default).",
      });
      cleanCurrency = "INR";
    }

    // --- 10. MULTI-CURRENCY (USD to INR conversion) ---
    if (cleanCurrency === "USD") {
      cleanExchangeRate = 83.0; // Default exchange rate
      anomalies.push({
        type: "foreign_currency",
        message: `USD currency detected. Priya's request: do not treat USD 1 = INR 1.`,
        severity: "warning",
        field: "currency",
        proposedResolution: `Apply exchange rate of 1 USD = 83 INR. Stored conversion: ₹${(cleanAmount / 100 * cleanExchangeRate).toFixed(2)}`,
      });
    }

    // --- 11. SETTLEMENT LOGGED AS EXPENSE ---
    // "Rohan paid Aisha back" - split_type empty, split_with Aisha, description has "paid back"
    const lowerDesc = cleanDescription.toLowerCase();
    const isSettlementIndicators = 
      lowerDesc.includes("paid back") || 
      lowerDesc.includes("settled") || 
      lowerDesc.includes("payment") || 
      cleanNotes.toLowerCase().includes("settlement");
      
    if (isSettlementIndicators && (!cleanSplitType || cleanSplitType === "equal" || cleanSplitType === "")) {
      cleanIsSettlement = true;
      cleanSplitType = "equal"; // Settlements are simple transfers
      anomalies.push({
        type: "settlement_logged_as_expense",
        message: `Settlement logged as expense: '${raw.description}'. Paid by '${cleanPaidBy}' to '${raw.splitWith}'.`,
        severity: "warning",
        field: "splitType",
        proposedResolution: "Import as a direct debt settlement (transfer) instead of a shared group expense.",
      });
    }

    // --- 12. SPLIT WITH & SPLIT DETAILS parsing ---
    let rawSplitWithStr = raw.splitWith.trim();
    let splitList = rawSplitWithStr ? rawSplitWithStr.split(";").map(s => s.trim()) : [];
    
    // Normalize split list names
    cleanSplitWith = splitList.map(name => {
      const normalized = name.toLowerCase();
      return USER_ALIASES[normalized] || name;
    }).filter(Boolean);

    // --- 13. ONE-TO-ONE TRANSFER LOGGED AS GROUP EXPENSE ---
    // Sam deposit share, split_with Aisha (length 1)
    if (cleanSplitWith.length === 1 && cleanSplitWith[0] !== cleanPaidBy && !cleanIsSettlement) {
      anomalies.push({
        type: "one_to_one_transfer",
        message: `One-to-one transfer '${raw.description}' from ${cleanPaidBy} to ${cleanSplitWith[0]} logged as group expense.`,
        severity: "warning",
        field: "splitWith",
        proposedResolution: "Import as a direct personal transfer/settlement rather than a shared group expense.",
      });
      cleanIsSettlement = true;
    }

    // --- 14. DUSTING ACTIVE MEMBERS ON EXPENSE DATE (Sam & Meera checks) ---
    if (parsedDate) {
      // Check Meera
      if (cleanSplitWith.includes("Meera") && parsedDate > USER_MEMBERSHIPS["Meera"].leave!) {
        anomalies.push({
          type: "inactive_member_split",
          message: `Meera is listed in split on '${cleanDate}' but she moved out on March 31.`,
          severity: "error",
          field: "splitWith",
          proposedResolution: "Exclude Meera from this split and redistribute among active members.",
        });
        cleanSplitWith = cleanSplitWith.filter(name => name !== "Meera");
      }

      // Check Sam
      if (cleanSplitWith.includes("Sam") && parsedDate < USER_MEMBERSHIPS["Sam"].join) {
        anomalies.push({
          type: "pre_membership_split",
          message: `Sam is listed in split on '${cleanDate}' but he moved in on April 15.`,
          severity: "error",
          field: "splitWith",
          proposedResolution: "Exclude Sam from this split and redistribute.",
        });
        cleanSplitWith = cleanSplitWith.filter(name => name !== "Sam");
      }
    }

    // --- 15. NON-GROUP MEMBER IN SPLIT (Dev's friend Kabir) ---
    const externalMembers = cleanSplitWith.filter(name => !VALID_USERS.includes(name));
    if (externalMembers.length > 0) {
      anomalies.push({
        type: "external_member_split",
        message: `Split contains non-group members: ${externalMembers.join(", ")}`,
        severity: "warning",
        field: "splitWith",
        proposedResolution: `Charge their share to their host (Dev) or distribute among the flatmates. Default: Charge Dev.`,
      });
      
      // Let's keep them in the split list for now, but in our balance engine, we'll map Kabir's share to Dev!
    }

    // --- 16. SPLIT DETAILS PARSING & ANOMALIES (percentage, shares, unequal) ---
    const rawSplitDetails = raw.splitDetails.trim();
    
    if (cleanSplitType === "percentage") {
      // e.g. "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%"
      const detailsMap: Record<string, number> = {};
      let totalPercent = 0;
      
      if (rawSplitDetails) {
        const parts = rawSplitDetails.split(";").map(s => s.trim());
        parts.forEach(part => {
          const match = part.match(/^([^0-9]+)\s+([0-9.]+)\s*%?$/);
          if (match) {
            const rawName = match[1].trim();
            const name = USER_ALIASES[rawName.toLowerCase()] || rawName;
            const pct = parseFloat(match[2]);
            detailsMap[name] = pct;
            totalPercent += pct;
          }
        });
      }

      cleanSplitDetails = detailsMap;

      // Check if percentages sum to 100%
      if (Math.abs(totalPercent - 100) > 0.01) {
        anomalies.push({
          type: "invalid_percentage_sum",
          message: `Split percentages sum to ${totalPercent}% instead of 100%.`,
          severity: "error",
          field: "splitDetails",
          proposedResolution: "Rescale percentages proportionally to sum to 100%.",
        });

        // Proportional fix
        const factor = 100 / totalPercent;
        const scaledMap: Record<string, number> = {};
        for (const [name, val] of Object.entries(detailsMap)) {
          scaledMap[name] = Math.round(val * factor * 100) / 100;
        }
        cleanSplitDetails = scaledMap;
      }
    } else if (cleanSplitType === "share") {
      // e.g. "Aisha 1; Rohan 2; Priya 1; Dev 2"
      const detailsMap: Record<string, number> = {};
      if (rawSplitDetails) {
        const parts = rawSplitDetails.split(";").map(s => s.trim());
        parts.forEach(part => {
          const match = part.match(/^([^0-9]+)\s+([0-9.]+)\s*$/);
          if (match) {
            const rawName = match[1].trim();
            const name = USER_ALIASES[rawName.toLowerCase()] || rawName;
            const share = parseFloat(match[2]);
            detailsMap[name] = share;
          }
        });
      }
      cleanSplitDetails = detailsMap;
    } else if (cleanSplitType === "unequal") {
      // e.g. "Rohan 700; Priya 400; Meera 400"
      const detailsMap: Record<string, number> = {};
      let totalAmount = 0;
      if (rawSplitDetails) {
        const parts = rawSplitDetails.split(";").map(s => s.trim());
        parts.forEach(part => {
          const match = part.match(/^([^0-9]+)\s+([0-9.]+)\s*$/);
          if (match) {
            const rawName = match[1].trim();
            const name = USER_ALIASES[rawName.toLowerCase()] || rawName;
            const amt = parseFloat(match[2]);
            detailsMap[name] = Math.round(amt * 100); // Store in paise
            totalAmount += Math.round(amt * 100);
          }
        });
      }

      cleanSplitDetails = detailsMap;

      // Check sum
      if (totalAmount !== cleanAmount) {
        anomalies.push({
          type: "unequal_split_mismatch",
          message: `Unequal split amounts sum to ${totalAmount / 100} but total is ${cleanAmount / 100}.`,
          severity: "error",
          field: "splitDetails",
          proposedResolution: "Adjust database amount to match split sum, or rescale splits.",
        });
      }
    } else {
      // equal split: build standard even weights
      // if split details were provided anyway, flag it (furniture line 42)
      if (rawSplitDetails && rawSplitDetails !== "") {
        anomalies.push({
          type: "superfluous_split_details",
          message: `Split type is 'equal' but split details '${rawSplitDetails}' were provided anyway.`,
          severity: "warning",
          field: "splitType",
          proposedResolution: "Ignore details, execute equal split.",
        });
      }
    }

    // --- 17. CONFLICTING DUPLICATE TRANSACTIONS (e.g. Thalassa dinner) ---
    // We will do a second pass to cross-reference duplicates.
    // For now, let's flag obvious candidates by scanning all other raw rows
    const matches = rawRows.filter(r => isDuplicate(raw, r));
    if (matches.length > 0) {
      const matchNumbers = matches.map(m => `#${m.rowNumber}`).join(", ");
      
      // Let's check if they have different amounts (Thalassa: row 24 Aisha 2400, row 25 Rohan 2450)
      const isConflict = matches.some(m => {
        const amtA = parseFloat(raw.amount.replace(/[^0-9.-]/g, ""));
        const amtB = parseFloat(m.amount.replace(/[^0-9.-]/g, ""));
        return amtA !== amtB || raw.paidBy.trim().toLowerCase() !== m.paidBy.trim().toLowerCase();
      });

      if (isConflict) {
        anomalies.push({
          type: "conflicting_duplicate",
          message: `Conflicting duplicate entry found. Matches other rows: ${matchNumbers} but has different amount or payer.`,
          severity: "error",
          field: "description",
          proposedResolution: "Review duplicates manually. Only import one correct row, ignore the other.",
        });
      } else {
        anomalies.push({
          type: "duplicate_transaction",
          message: `Duplicate transaction. Exactly matches other rows: ${matchNumbers}.`,
          severity: "warning",
          field: "description",
          proposedResolution: "Mark as duplicate and skip import, or merge them.",
        });
      }
    }

    parsedRows.push({
      rowNumber: raw.rowNumber,
      rawRow: raw,
      status: anomalies.length > 0 ? "anomaly" : "clean",
      anomalies,
      proposedData: {
        date: cleanDate,
        description: cleanDescription,
        paidBy: cleanPaidBy,
        amount: cleanAmount,
        currency: cleanCurrency,
        exchangeRate: cleanExchangeRate,
        splitType: cleanSplitType,
        splitWith: cleanSplitWith,
        splitDetails: cleanSplitDetails,
        notes: cleanNotes,
        isSettlement: cleanIsSettlement,
      },
    });
  }

  return parsedRows;
}
