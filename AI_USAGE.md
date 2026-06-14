# AI Tools & Collaboration Log (AI_USAGE.md)

This document details the AI collaboration tools used for developing SplitSync, key prompts, and three concrete instances where the AI generated erroneous code, how it was caught, and how it was corrected.

---

## 🤖 AI Tools & Prompts
* **Primary AI Collaborator:** Antigravity (Google DeepMind Advanced Agentic Coding team)
* **Model:** Gemini 3.5 Flash

### Key Prompt Patterns
1. *Analysis & Anomaly Extraction:* "Parse the CSV lines and list all the discrepancies in date, amounts, names, splits, currency, and membership periods."
2. *RELATIONAL DB Rules:* "Write a Prisma schema for SQLite that maps groups, expenses, splits, and dynamic memberships where member join/leave dates are tracked."
3. *Split Remainder Distribution:* "Implement an algorithm for equal, percentage, and share splits that distributes remainder rounding values in integers."

---

## 🐛 Concrete AI Errors & Corrections

### Case 1: Silent Space Trimming in CSV Parser
* **The Error:** The AI generated a custom CSV parser `parseCSVLine` that called `current.trim()` when pushing fields into the parsed array. This silently stripped leading and trailing spaces from fields. As a result, the anomaly detector could not detect that Row 29’s amount field (` 1450 `) contained spaces. It parsed as `"1450"` and bypassed the `dirty_amount` check.
* **How Caught:** Caught by the native unit tests in `src/__tests__/importer.test.ts` where the assertion `Row 29 should flag dirty amount` failed.
* **The Fix:** Refactored `parseCSVLine` to return raw, untrimmed strings. The anomaly engine was updated to compare the untrimmed `raw.amount` against the cleaned numeric string to correctly flag spacing anomalies.

### Case 2: Deprecated Datasource URLs in Prisma v7
* **The Error:** The AI proposed standard schema configurations from older Prisma versions, adding `url = env("DATABASE_URL")` to the `datasource db` block in `prisma/schema.prisma` and instantiating `new PrismaClient()` with no arguments. Because Prisma v7.8.0 was installed, the CLI crashed with validation error `P1012`, as Prisma 7 deprecates direct URL configuration in schema files.
* **How Caught:** Caught during initial migration execution: `npx prisma migrate dev --name init`.
* **The Fix:** Removed the `url` property from the schema file, moving database configuration to `prisma.config.ts`. Installed `@prisma/adapter-better-sqlite3` and updated our client initialization helper `db.ts` and seed script `seed.js` to instantiate the client using the driver adapter pattern: `new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })`.

### Case 3: Fuzzy Duplicate Matching failures
* **The Error:** The AI proposed comparing duplicates by normalising description strings (lowercase, removing spaces/punctuation) and checking string inclusion. This failed for "Dinner at Marina Bites" (row 5) vs "dinner - marina bites" (row 6) and "Dinner at Thalassa" (row 24) vs "Thalassa dinner" (row 25) because the word "at" altered the letter sequences so that they did not contain each other.
* **How Caught:** Caught by the native unit tests where the assertion `Row 5 duplicate should be flagged` failed.
* **The Fix:** Refactored `isDuplicate` to use keyword tokenization. We split descriptions into core words, filtered out common filler words (at, for, the, with, etc.), and matched if they shared a high percentage of keywords, or if their core keywords matched exactly regardless of word order, payer, or amount.
