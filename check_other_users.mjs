import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

// Get cycles for other users
const cycles = await db.execute(`
  SELECT c.id, c.title, c.userId, u.name as userName, u.openId, u.id as userTableId
  FROM cycles c 
  LEFT JOIN users u ON c.userId = u.id 
  WHERE c.userId != 1
  ORDER BY c.userId, c.id DESC
`);
console.log("=== CYCLES FOR OTHER USERS ===");
console.table(cycles[0]);

// Check if there are orphaned cycles (userId doesn't match any user)
const orphaned = await db.execute(`
  SELECT c.id, c.title, c.userId
  FROM cycles c 
  LEFT JOIN users u ON c.userId = u.id 
  WHERE u.id IS NULL
`);
console.log("\n=== ORPHANED CYCLES (no matching user) ===");
console.table(orphaned[0]);

// Check total cycles per user
const summary = await db.execute(`
  SELECT c.userId, u.name, COUNT(*) as cycleCount
  FROM cycles c 
  LEFT JOIN users u ON c.userId = u.id 
  GROUP BY c.userId, u.name
  ORDER BY cycleCount DESC
`);
console.log("\n=== CYCLES PER USER ===");
console.table(summary[0]);

process.exit(0);
