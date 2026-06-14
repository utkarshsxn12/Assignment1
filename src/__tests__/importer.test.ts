import { test, mock } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { parseAndAnalyzeCSV } from "../lib/importer";

test("CSV Importer & Anomaly Detection Engine Test Suite", () => {
  // Read raw CSV contents
  const csvPath = path.resolve(process.cwd(), "expenses_export.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse and analyze
  const parsedRows = parseAndAnalyzeCSV(csvContent);

  // Assertions
  assert.strictEqual(parsedRows.length, 42, "Should parse exactly 42 rows from CSV");

  // 1. Check Row 5 & 6 (Marina Bites duplicates)
  const row5 = parsedRows.find(r => r.rowNumber === 5);
  const row6 = parsedRows.find(r => r.rowNumber === 6);
  assert.ok(row5 && row6, "Rows 5 and 6 should exist");
  assert.ok(
    row5.anomalies.some(a => a.type === "duplicate_transaction" || a.type === "conflicting_duplicate"),
    "Row 5 duplicate should be flagged"
  );

  // 2. Check Row 7 (Electricity Feb dirty amount "1,200")
  const row7 = parsedRows.find(r => r.rowNumber === 7);
  assert.ok(row7, "Row 7 should exist");
  assert.strictEqual(row7.proposedData.amount, 120000, "Should clean '1,200' to 120000 paise (₹1,200)");
  assert.ok(
    row7.anomalies.some(a => a.type === "dirty_amount"),
    "Row 7 should flag dirty amount"
  );

  // 3. Check Row 10 (Cylinder refill high precision 899.995)
  const row10 = parsedRows.find(r => r.rowNumber === 10);
  assert.ok(row10, "Row 10 should exist");
  assert.strictEqual(row10.proposedData.amount, 90000, "Should round 899.995 to 900.00 (90000 paise)");
  assert.ok(
    row10.anomalies.some(a => a.type === "high_precision_amount"),
    "Row 10 should flag high precision amount"
  );

  // 4. Check Row 11 (Groceries DMart Priya S alias)
  const row11 = parsedRows.find(r => r.rowNumber === 11);
  assert.ok(row11, "Row 11 should exist");
  assert.strictEqual(row11.proposedData.paidBy, "Priya", "Should map Priya S alias to Priya");
  assert.ok(
    row11.anomalies.some(a => a.type === "payer_alias"),
    "Row 11 should flag payer alias"
  );

  // 5. Check Row 12 (Aisha birthday cake unequal split)
  const row12 = parsedRows.find(r => r.rowNumber === 12);
  assert.ok(row12, "Row 12 should exist");
  assert.strictEqual(row12.proposedData.currency, "INR", "Currency should be INR");
  assert.strictEqual(row12.proposedData.splitType, "unequal", "Split type should be unequal");
  assert.strictEqual(row12.proposedData.splitDetails["Rohan"], 70000, "Rohan share should be 70000 paise");

  // 6. Check Row 13 (House cleaning supplies missing paid_by)
  const row13 = parsedRows.find(r => r.rowNumber === 13);
  assert.ok(row13, "Row 13 should exist");
  assert.ok(
    row13.anomalies.some(a => a.type === "missing_payer"),
    "Row 13 should flag missing payer"
  );

  // 7. Check Row 14 (Rohan paid Aisha back settlement)
  const row14 = parsedRows.find(r => r.rowNumber === 14);
  assert.ok(row14, "Row 14 should exist");
  assert.strictEqual(row14.proposedData.isSettlement, true, "Should flag as settlement transfer");
  assert.ok(
    row14.anomalies.some(a => a.type === "settlement_logged_as_expense" || a.type === "one_to_one_transfer"),
    "Row 14 should flag settlement/transfer"
  );

  // 8. Check Row 15 (Pizza Friday percentage sum mismatch 110%)
  const row15 = parsedRows.find(r => r.rowNumber === 15);
  assert.ok(row15, "Row 15 should exist");
  assert.ok(
    row15.anomalies.some(a => a.type === "invalid_percentage_sum"),
    "Row 15 should flag percentage sum mismatch"
  );
  // Total percent should be corrected to sum to 100
  const sumOfDetails = Object.values(row15.proposedData.splitDetails).reduce((sum, v) => sum + v, 0);
  assert.ok(Math.abs(sumOfDetails - 100) < 0.1, "Row 15 percentages should sum to 100% after correction");

  // 9. Check Row 20 (Goa villa booking USD currency)
  const row20 = parsedRows.find(r => r.rowNumber === 20);
  assert.ok(row20, "Row 20 should exist");
  assert.strictEqual(row20.proposedData.currency, "USD", "Should retain original USD currency");
  assert.strictEqual(row20.proposedData.exchangeRate, 83.0, "Should propose 83.0 exchange rate");
  assert.ok(
    row20.anomalies.some(a => a.type === "foreign_currency"),
    "Row 20 should flag foreign currency"
  );

  // 10. Check Row 23 (Parasailing guest Kabir)
  const row23 = parsedRows.find(r => r.rowNumber === 23);
  assert.ok(row23, "Row 23 should exist");
  assert.ok(
    row23.anomalies.some(a => a.type === "external_member_split"),
    "Row 23 should flag Kabir as external member"
  );

  // 11. Check Row 26 (Refund with negative amount)
  const row26 = parsedRows.find(r => r.rowNumber === 26);
  assert.ok(row26, "Row 26 should exist");
  assert.strictEqual(row26.proposedData.amount, -3000, "Should store refund as -3000 paise (-30 USD)");
  assert.ok(
    row26.anomalies.some(a => a.type === "negative_amount"),
    "Row 26 should flag negative amount"
  );

  // 12. Check Row 29 (Electricity Mar spaces in amount)
  const row29 = parsedRows.find(r => r.rowNumber === 29);
  assert.ok(row29, "Row 29 should exist");
  assert.strictEqual(row29.proposedData.amount, 145000, "Should clean spaces to parse 145000 paise (₹1,450)");
  assert.ok(
    row29.anomalies.some(a => a.type === "dirty_amount"),
    "Row 29 should flag dirty amount"
  );

  // 13. Check Row 31 (Swiggy dinner 0 INR)
  const row31 = parsedRows.find(r => r.rowNumber === 31);
  assert.ok(row31, "Row 31 should exist");
  assert.strictEqual(row31.proposedData.amount, 0, "Should parse amount as 0");
  assert.ok(
    row31.anomalies.some(a => a.type === "zero_amount"),
    "Row 31 should flag zero amount"
  );

  // 14. Check Row 34 (Deep cleaning ambiguous date)
  const row34 = parsedRows.find(r => r.rowNumber === 34);
  assert.ok(row34, "Row 34 should exist");
  assert.strictEqual(row34.proposedData.date, "2026-04-05", "Should normalize date to April 5, 2026");
  assert.ok(
    row34.anomalies.some(a => a.type === "ambiguous_date"),
    "Row 34 should flag ambiguous date"
  );

  // 15. Check Row 36 (Groceries BigBasket Meera inactive split)
  const row36 = parsedRows.find(r => r.rowNumber === 36);
  assert.ok(row36, "Row 36 should exist");
  assert.ok(!row36.proposedData.splitWith.includes("Meera"), "Meera should be excluded from April 2 split");
  assert.ok(
    row36.anomalies.some(a => a.type === "inactive_member_split"),
    "Row 36 should flag Meera as inactive member in split list"
  );

  console.log("✔ All parser and anomaly detection tests passed successfully!");
});
