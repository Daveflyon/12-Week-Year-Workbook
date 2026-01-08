import { drizzle } from "drizzle-orm/mysql2";
const db = drizzle(process.env.DATABASE_URL);

// Check goals for David's most recent cycle (210048)
console.log("=== GOALS FOR DAVID'S RECENT CYCLES ===");
const davidGoals = await db.execute(`
  SELECT g.id, g.cycleId, g.title, c.title as cycleName
  FROM goals g
  JOIN cycles c ON g.cycleId = c.id
  WHERE c.userId = 1
  ORDER BY c.id DESC
  LIMIT 10
`);
console.table(davidGoals[0]);

// Check goals for Robert's cycles
console.log("\n=== GOALS FOR ROBERT'S CYCLES ===");
const robertGoals = await db.execute(`
  SELECT g.id, g.cycleId, g.title, c.title as cycleName
  FROM goals g
  JOIN cycles c ON g.cycleId = c.id
  WHERE c.userId = 60011
  ORDER BY c.id DESC
`);
console.table(robertGoals[0]);

// Check if there are any goals at all for the most recent cycles
console.log("\n=== CHECKING SPECIFIC CYCLES ===");
const specificCycles = await db.execute(`
  SELECT c.id, c.title, c.userId, 
    (SELECT COUNT(*) FROM goals WHERE cycleId = c.id) as goalCount
  FROM cycles c
  WHERE c.id IN (210048, 150001, 60001)
`);
console.table(specificCycles[0]);

// Check the cycle that's actually being shown (60001 - the one with goals)
console.log("\n=== CYCLE 60001 DETAILS ===");
const cycle60001 = await db.execute(`SELECT * FROM cycles WHERE id = 60001`);
console.table(cycle60001[0]);

const goals60001 = await db.execute(`SELECT * FROM goals WHERE cycleId = 60001`);
console.log("Goals for cycle 60001:");
console.table(goals60001[0]);

process.exit(0);
