# Architectural & Product Decisions Log (DECISIONS.md)

This document details the critical design decisions made during the development of SplitSync, the alternatives considered, and the rationale behind each choice.

---

## 1. Database & Persistence Layer
* **Decision:** SQLite with Prisma v7 ORM.
* **Options Considered:**
  1. *PostgreSQL:* Standard relational database, but requires installing Postgres locally, starting Docker containers, or configuring cloud credentials. High setup friction for the evaluator.
  2. *JSON Files:* Zero setup, but lacks relational integrity, joins, transactions, and ignores the strict "use relational DBs only" minimum requirement.
  3. *SQLite:* Relational database, self-contained in a single file (`dev.db`), supports transactional queries, joins, and requires zero installation or cloud setup for the reviewer.
* **Rationale:** SQLite satisfies the relational database requirement while guaranteeing 100% portability. Prisma v7 was selected to enforce strict schema types and migration tracking.

---

## 2. Split Storage Design
* **Decision:** Granular `ExpenseSplit` records (junction table).
* **Options Considered:**
  1. *JSON Column:* Storing split details as JSON directly inside the `Expense` table. (Fails normalization, hard to query net balances using SQL aggregations, poor audit support).
  2. *Relational Junction Table:* Storing each participant's share as a separate row in an `ExpenseSplit` table.
* **Rationale:** A junction table allows clean SQL summation of what Rohan owes (`SELECT SUM(amount) FROM ExpenseSplit WHERE userId = Rohan`). This directly supports Rohan's request for zero magic numbers and detailed audit trails.

---

## 3. Money Representation & Math
* **Decision:** Store all monetary values as **integers in paise** (1 INR = 100 paise).
* **Options Considered:**
  1. *Floating Point (Floats):* Simple but prone to floating-point representation errors (e.g. `0.1 + 0.2` becomes `0.30000000000000004`).
  2. *Decimal Types:* Supported by SQLite, but mapping floats through ORMs can still lead to precision drift.
  3. *Integer Paise:* Stores values in smallest currency unit. Zero float errors.
* **Rationale:** Integer math prevents rounding leakage. When splitting an odd amount (e.g., ₹10.00 split among 3 people), our math allocates 334 paise, 333 paise, and 333 paise. The remainder is distributed 1 paisa at a time, ensuring splits sum to exactly the total amount.

---

## 4. Staging Importer UI
* **Decision:** Interactive staging table with inline resolutions.
* **Options Considered:**
  1. *Silent Guess Importer:* A batch script that automatically cleans names, dates, and silently chooses which duplicates to delete. (Fails Meera's request to approve changes/deletions).
  2. *Interactive Staging Dashboard:* A screen that parses the CSV into a temporary state, highlights anomalies in red/orange, proposes clean versions, and lets the user choose action toggles (import/skip) before committing to the DB.
* **Rationale:** An interactive staging dashboard satisfies Meera's requirements and elevates the product's UX. It provides a visual report of what is wrong and how it is being resolved.

---

## 5. Dynamic Membership Windows
* **Decision:** Store `joinDate` and `leaveDate` in `GroupMember` and enforce date checks at the balance level.
* **Options Considered:**
  1. *Static Groups:* Group members are constant. (Fails Sam's and Meera's requests; Sam gets charged for March, Meera gets charged for April).
  2. *Dynamic Subgroups:* Creating new groups every time membership changes (e.g. "Flat February", "Flat March", "Flat April"). (Very messy, hard to track balances across groups).
  3. *Temporal Membership:* A single group where memberships have active date ranges.
* **Rationale:** Temporal membership allows users to belong to the same group but only participate in splits if the expense date falls within their membership window. This automatically solves Sam's and Meera's complaints.

---

## 6. Guest / External Member Resolution
* **Decision:** Attribute the share of external guests to their host.
* **Options Considered:**
  1. *Add Guest as Group Member:* Add "Kabir" as a flatmate. (Fails logically; Kabir was just a weekend visitor, not a flatmate paying rent).
  2. *Divide Guest Share among Flatmates:* Split Kabir's share among Aisha, Rohan, Priya, Dev.
  3. *Attribute Guest Share to Host:* Charge Dev for Kabir's share, as Dev invited Kabir.
* **Rationale:** Attributing Kabir's share to Dev is the fairest policy for shared house living, as Dev is responsible for his visitor.
