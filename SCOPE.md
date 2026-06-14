# Project Scope & Anomaly Log (SCOPE.md)

This document contains the relational database schema design and the comprehensive log of 20 distinct data anomalies detected and resolved by SplitSync.

---

## 💾 Relational Database Schema

SplitSync uses **SQLite** as its relational database. The schema is defined below using Prisma Schema syntax.

### Prisma Schema (`prisma/schema.prisma`)
```prisma
model User {
  id           String        @id @default(uuid())
  name         String        @unique
  email        String?
  createdAt    DateTime      @default(now())
  memberships  GroupMember[]
  expensesPaid Expense[]     @relation("PaidBy")
  splits       ExpenseSplit[]
}

model Group {
  id          String        @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime      @default(now())
  members     GroupMember[]
  expenses    Expense[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinDate  DateTime
  leaveDate DateTime?
  group     Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model Expense {
  id           String         @id @default(uuid())
  groupId      String
  description  String
  amount       Int            // stored in paise (e.g. ₹10.50 is stored as 1050)
  currency     String         // "INR" or "USD"
  exchangeRate Float          @default(1.0) // Conversion rate: original_amount * exchangeRate = amount_in_inr
  splitType    String         // "equal", "unequal", "percentage", "share"
  date         DateTime
  paidById     String
  notes        String?
  isSettlement Boolean        @default(false)
  isActive     Boolean        @default(true)
  createdAt    DateTime       @default(now())
  group        Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy       User           @relation("PaidBy", fields: [paidById], references: [id], onDelete: Cascade)
  splits       ExpenseSplit[]
}

model ExpenseSplit {
  id              String   @id @default(uuid())
  expenseId       String
  userId          String
  amount          Int      // stored in paise, the share this user owes
  shareValue      Float?   // raw share value (e.g., 2 in a 2:1 split)
  percentageValue Float?   // raw percentage (e.g., 30 for 30%)
  expense         Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
}

model ImportSession {
  id        String      @id @default(uuid())
  createdAt DateTime    @default(now())
  status    String      // "pending", "completed", "cancelled"
  filename  String
  rows      ImportRow[]
}

model ImportRow {
  id               String        @id @default(uuid())
  sessionId        String
  rowNumber        Int
  rawLine          String
  status           String        // "clean", "anomaly", "ignored", "imported"
  date             String?
  description      String?
  paidBy           String?
  amount           String?
  currency         String?
  splitType        String?
  splitWith        String?
  splitDetails     String?
  notes            String?
  anomalies        String        // JSON array of detected anomalies
  resolutionAction String?       // JSON detailing the selected resolution action
  resolvedData     String?       // JSON of the cleaned data ready for database insertion
  session          ImportSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

---

## 🔍 Anomaly Resolution Log

Our importer parses `expenses_export.csv` and flags the following 20 anomalies. Below is our detection logic and chosen resolution policy for each.

| # | Anomaly Type | Row/Line | Detection Logic | Resolution Policy |
|---|--------------|----------|-----------------|-------------------|
| **1** | **Duplicate Entry** | Row 5 & 6 (Marina Bites) | Same date, overlap in description words, same payer, same amount. | **Proposed skip:** Skip Row 6, import Row 5. Pre-configured in staging dashboard. |
| **2** | **Dirty Number (Quotes/Commas)** | Row 7 (Electricity Feb) | Amount has quotes and commas (`"1,200"`). | **Strip formatting:** Strip quotes and commas, parse as `120000` paise. |
| **3** | **High Decimal Precision** | Row 10 (Cylinder refill) | Amount has 3 decimal places (`899.995`). | **Standard rounding:** Round to 2 decimals (`900.00` INR = `90000` paise). |
| **4** | **Name Alias/Mismatch** | Row 11 (`Priya S`) | Payer name doesn't match registered user list, but matches known alias. | **Alias Mapping:** Map `Priya S` -> `Priya`. |
| **5** | **Name Case/Space** | Row 27 (`rohan `) | Lowercase, trailing whitespace. | **Normalize:** Trim spaces and convert to Pascal Case -> `Rohan`. |
| **6** | **Missing Payer** | Row 13 (Cleaning supplies) | `paid_by` field is empty. | **Interactive Assign:** Raise warning, allow user to assign payer in UI. Defaults to Aisha. |
| **7** | **Settlement Logged as Expense** | Row 14 (Rohan paid Aisha) | Description has "paid back", split_type empty, note says "settlement". | **Import as Transfer:** Import as direct settlement transfer. Payer: Rohan, Split: Aisha, Owed: 0 for group. |
| **8** | **Wrong Percentage Sum** | Row 15 (Pizza Friday) | Split details percentages sum to 110% instead of 100%. | **Rescale proportionally:** Rescale each percentage to sum to 100%. Distribute remaining paise. |
| **9** | **Inconsistent Date Format** | Row 16 (`01/03/2026`) | Date format is `DD/MM/YYYY` instead of standard `YYYY-MM-DD`. | **Standardize:** Parse date parts and convert to ISO date string (`2026-03-01`). |
| **10** | **MMM DD Date Format** | Row 27 (`Mar 14`) | Date format is word abbreviation and day number. | **Standardize:** Map month names and assume year 2026 -> `2026-03-14`. |
| **11** | **Ambiguous Date Format** | Row 34 (`04/05/2026`) | Could be April 5th or May 4th. Note indicates format mess. | **Contextual Parse:** Analyze adjacent row dates. Parse as April 5th, 2026. Flag in staging UI. |
| **12** | **Missing Currency** | Row 28 (DMart groceries) | Currency field is empty. | **Default Currency:** Default to group currency (`INR`). |
| **13** | **Foreign Currency (USD)** | Row 20, 21, 23, 26 (Goa) | Currency field is `USD`. | **Convert to local:** Multiply base USD amount by exchange rate (Default `83.0` INR) to store paise. |
| **14** | **Negative Amount (Refund)** | Row 26 (Parasailing refund) | Amount is `-30` USD. | **Refund split:** Split as negative amount, reducing balances of all participants in the split. |
| **15** | **Zero-Amount Expense** | Row 31 (Swiggy dinner) | Amount is `0` INR. | **Log but skip balance:** Keep in database history but do not generate splits. |
| **16** | **Whitespace in Amount** | Row 29 (Electricity Mar) | Amount string contains spaces (` 1450 `). | **Trim and Clean:** Strip spaces, parse as `145000` paise. |
| **17** | **Guest / Non-Group Member** | Row 23 (Parasailing Kabir) | Participant `Dev's friend Kabir` is not in flatmates group. | **Host Attribution:** Charge guest's share to their host `Dev` in the final splits. |
| **18** | **Inactive Member in Split** | Row 36 (April groceries) | Meera listed in split on April 2, but she left on March 31. | **Temporal Prune:** Remove Meera from split. Split amount equally among active members. |
| **19** | **Pre-Membership Split** | Row 7 (Electricity Feb) | Sam not in flat, but checks date range. | **Dynamic Dates:** Sam joined April 15. Ensure balance calculation filters out March expenses. |
| **20** | **Conflict Splits (Equal + details)** | Row 42 (Furniture) | Split type is `equal` but share details are provided anyway. | **Override details:** Ignore details, split equally among active members. |
