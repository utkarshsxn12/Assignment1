const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const url = process.env.DATABASE_URL || "file:./dev.db";
console.log("Using database URL for seeding:", url);

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create users
  const aisha = await prisma.user.upsert({
    where: { name: "Aisha" },
    update: {},
    create: { name: "Aisha", email: "aisha@example.com" },
  });

  const rohan = await prisma.user.upsert({
    where: { name: "Rohan" },
    update: {},
    create: { name: "Rohan", email: "rohan@example.com" },
  });

  const priya = await prisma.user.upsert({
    where: { name: "Priya" },
    update: {},
    create: { name: "Priya", email: "priya@example.com" },
  });

  const meera = await prisma.user.upsert({
    where: { name: "Meera" },
    update: {},
    create: { name: "Meera", email: "meera@example.com" },
  });

  const dev = await prisma.user.upsert({
    where: { name: "Dev" },
    update: {},
    create: { name: "Dev", email: "dev@example.com" },
  });

  const sam = await prisma.user.upsert({
    where: { name: "Sam" },
    update: {},
    create: { name: "Sam", email: "sam@example.com" },
  });

  // Create Group
  const group = await prisma.group.upsert({
    where: { id: "flatmates-group-id" }, // Fixed ID for seeding
    update: { name: "Flatmates Shared Expenses" },
    create: {
      id: "flatmates-group-id",
      name: "Flatmates Shared Expenses",
      description: "Shared rent, bills, and trip expenses",
    },
  });

  // Upsert group memberships with exact dynamic dates
  // Aisha: Joined Feb 1, 2026, active
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: aisha.id } },
    update: {},
    create: {
      groupId: group.id,
      userId: aisha.id,
      joinDate: new Date("2026-02-01T00:00:00Z"),
      leaveDate: null,
    },
  });

  // Rohan: Joined Feb 1, 2026, active
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: rohan.id } },
    update: {},
    create: {
      groupId: group.id,
      userId: rohan.id,
      joinDate: new Date("2026-02-01T00:00:00Z"),
      leaveDate: null,
    },
  });

  // Priya: Joined Feb 1, 2026, active
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: priya.id } },
    update: {},
    create: {
      groupId: group.id,
      userId: priya.id,
      joinDate: new Date("2026-02-01T00:00:00Z"),
      leaveDate: null,
    },
  });

  // Meera: Joined Feb 1, 2026, Left Mar 31, 2026
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: meera.id } },
    update: {
      leaveDate: new Date("2026-03-31T23:59:59Z"),
    },
    create: {
      groupId: group.id,
      userId: meera.id,
      joinDate: new Date("2026-02-01T00:00:00Z"),
      leaveDate: new Date("2026-03-31T23:59:59Z"),
    },
  });

  // Dev: Joined Mar 1, 2026 (for trip), Left Mar 31, 2026
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: dev.id } },
    update: {
      leaveDate: new Date("2026-03-31T23:59:59Z"),
    },
    create: {
      groupId: group.id,
      userId: dev.id,
      joinDate: new Date("2026-03-01T00:00:00Z"),
      leaveDate: new Date("2026-03-31T23:59:59Z"),
    },
  });

  // Sam: Joined Apr 15, 2026, active
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: sam.id } },
    update: {},
    create: {
      groupId: group.id,
      userId: sam.id,
      joinDate: new Date("2026-04-15T00:00:00Z"),
      leaveDate: null,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
