import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@12345!", 12);
  const memberPassword = await bcrypt.hash("Member@12345!", 12);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "System Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "Project Manager",
      passwordHash: memberPassword,
      role: "MANAGER",
    },
  });

  const dev1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Developer",
      passwordHash: memberPassword,
      role: "MEMBER",
    },
  });

  const dev2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Developer",
      passwordHash: memberPassword,
      role: "MEMBER",
    },
  });

  // Create board
  const board = await prisma.board.upsert({
    where: { slug: "main-project" },
    update: {},
    create: {
      name: "Main Project",
      slug: "main-project",
      description: "Primary development board",
      color: "#6366f1",
    },
  });

  // Add board members
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: admin.id } },
    update: {},
    create: { boardId: board.id, userId: admin.id, role: "OWNER" },
  });

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: manager.id } },
    update: {},
    create: { boardId: board.id, userId: manager.id, role: "ADMIN" },
  });

  for (const user of [dev1, dev2]) {
    await prisma.boardMember.upsert({
      where: { boardId_userId: { boardId: board.id, userId: user.id } },
      update: {},
      create: { boardId: board.id, userId: user.id, role: "MEMBER" },
    });
  }

  // Create columns
  const columnData = [
    { name: "Backlog", position: 0 },
    { name: "To Do", position: 1, isDefault: true },
    { name: "In Progress", position: 2, wipLimit: 3 },
    { name: "In Review", position: 3, wipLimit: 2 },
    { name: "Done", position: 4 },
  ];

  const columns: Record<string, { id: string }> = {};
  for (const col of columnData) {
    const column = await prisma.column.upsert({
      where: { id: `seed-col-${col.position}` },
      update: {},
      create: { id: `seed-col-${col.position}`, boardId: board.id, ...col },
    });
    columns[col.name] = column;
  }

  // Create labels
  const labelData = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Improvement", color: "#10b981" },
    { name: "Documentation", color: "#f59e0b" },
    { name: "Security", color: "#8b5cf6" },
  ];

  const labels: Record<string, { id: string }> = {};
  for (const lbl of labelData) {
    const label = await prisma.label.upsert({
      where: { boardId_name: { boardId: board.id, name: lbl.name } },
      update: {},
      create: { boardId: board.id, ...lbl },
    });
    labels[lbl.name] = label;
  }

  // Create tickets
  const tickets = [
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      columnId: columns["Done"]!.id,
      priority: "HIGH" as const,
      status: "DONE" as const,
      position: 0,
      assigneeId: dev1.id,
    },
    {
      title: "Implement user authentication",
      description: "JWT-based auth with refresh token rotation.",
      columnId: columns["Done"]!.id,
      priority: "CRITICAL" as const,
      status: "DONE" as const,
      position: 1,
      assigneeId: dev2.id,
    },
    {
      title: "Build Kanban board drag-and-drop",
      description: "Allow cards to be reordered within and between columns.",
      columnId: columns["In Progress"]!.id,
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      position: 0,
      assigneeId: dev1.id,
    },
    {
      title: "Add SLA tracking to tickets",
      description: "Track SLA deadlines and flag breached tickets.",
      columnId: columns["In Progress"]!.id,
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      position: 1,
      assigneeId: dev2.id,
    },
    {
      title: "Write API documentation",
      description: "Generate OpenAPI spec and host on /api-docs.",
      columnId: columns["To Do"]!.id,
      priority: "LOW" as const,
      status: "TODO" as const,
      position: 0,
    },
    {
      title: "Performance audit",
      description: "Profile database queries and identify N+1 issues.",
      columnId: columns["Backlog"]!.id,
      priority: "MEDIUM" as const,
      status: "TODO" as const,
      position: 0,
    },
  ];

  for (const t of tickets) {
    await prisma.ticket.upsert({
      where: { id: `seed-ticket-${t.position}-${t.columnId}` },
      update: {},
      create: {
        id: `seed-ticket-${t.position}-${t.columnId}`,
        boardId: board.id,
        creatorId: admin.id,
        ...t,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Test accounts:");
  console.log("  admin@example.com   / Admin@12345!  (ADMIN)");
  console.log("  manager@example.com / Member@12345! (MANAGER)");
  console.log("  alice@example.com   / Member@12345! (MEMBER)");
  console.log("  bob@example.com     / Member@12345! (MEMBER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
