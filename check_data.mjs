import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

// Get all users
const users = await db.execute('SELECT id, openId, name, email FROM users ORDER BY id');
console.log("=== USERS ===");
console.table(users[0]);

// Get all cycles with user info
const cycles = await db.execute(`
  SELECT c.id, c.title, c.userId, c.status, u.name as userName, u.openId
  FROM cycles c 
  LEFT JOIN users u ON c.userId = u.id 
  ORDER BY c.id DESC 
  LIMIT 20
`);
console.log("\n=== CYCLES ===");
console.table(cycles[0]);

// Get goals count per cycle
const goals = await db.execute(`
  SELECT g.cycleId, COUNT(*) as goalCount, c.title as cycleName
  FROM goals g
  JOIN cycles c ON g.cycleId = c.id
  GROUP BY g.cycleId, c.title
`);
console.log("\n=== GOALS PER CYCLE ===");
console.table(goals[0]);

process.exit(0);
