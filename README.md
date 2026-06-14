# SplitSync ⚡ - Shared Expenses App & Conflict Resolution Engine

SplitSync is a relational, full-stack shared expenses web application built to ingest, staging-analyze, and resolve messy shared house spreadsheets. It satisfies the unique requirements of Aisha, Rohan, Priya, Meera, and Sam.

## 🔗 Live Application & Codebase
* **Deployed URL:** (Deployable to Vercel/Render with local SQLite or postgres, setup instructions below)
* **GitHub Repository:** https://github.com/utkarshsxn12/Assignment1

---

## 🛠️ Technology Stack
* **Framework:** Next.js 16 (React 19, App Router)
* **Language:** TypeScript
* **Database:** SQLite (Relational, self-contained in workspace root)
* **ORM:** Prisma v7 (using `@prisma/adapter-better-sqlite3` driver adapter)
* **Styling:** Vanilla CSS (CSS Modules) styled with a dark, glassmorphic design system
* **Testing:** Native Node.js test runner (`node --test`) with `tsx` (no Jest/Vitest configuration overhead)

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js:** v22.19.0 (or newer)
* **npm:** v10.9.3 (or newer)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/utkarshsxn12/Assignment1.git
cd Assignment1
npm install
```

### 2. Configure Database
Initialize the SQLite database, run migrations, and seed the flatmate data (Aisha, Rohan, Priya, Meera, Sam, Dev with their dynamic timelines):
```bash
# Apply Prisma migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Unit Tests
To run the CSV parser and anomaly detection engine unit tests (runs natively in 0.15s):
```bash
npm test
```
*(This maps to the package.json script: `node --import tsx --test src/__tests__/importer.test.ts`)*

---

## 👥 Flatmate Persona Login (Testing Help)
For easy manual review, a **View Persona** dropdown is available in the top-right corner of the navigation bar. You can switch personas instantly to see:
* **Aisha's View:** Simplified Splitwise-style direct payments ("Who pays whom, how much, done").
* **Rohan's View:** Exact audit trails proving how his balance is computed without magic numbers.
* **Sam's View:** Proof that he is not charged for March Rent/Electricity because he moved in mid-April.
* **Meera's View:** Staging CSV review dashboard allowing duplicates cleaning and approval before DB commit.
