import { describe, expect, it, beforeAll, afterAll, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { cycles, goals, tactics } from "../drizzle/schema";
import { eq, and, like } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use a unique test user ID to isolate test data
const TEST_USER_ID = 999999;
const TEST_USER_OPEN_ID = "test-user-12wy-cleanup";

// Track created test cycles for cleanup
const createdCycleIds: number[] = [];

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: TEST_USER_ID,
    openId: TEST_USER_OPEN_ID,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

// Cleanup function to remove test data
async function cleanupTestData() {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Delete tactics for test cycles
    for (const cycleId of createdCycleIds) {
      const cycleGoals = await db.select().from(goals).where(eq(goals.cycleId, cycleId));
      for (const goal of cycleGoals) {
        await db.delete(tactics).where(eq(tactics.goalId, goal.id));
      }
      await db.delete(goals).where(eq(goals.cycleId, cycleId));
    }
    
    // Delete test cycles
    for (const cycleId of createdCycleIds) {
      await db.delete(cycles).where(eq(cycles.id, cycleId));
    }
    
    // Also clean up any cycles created by the test user that might have been missed
    const testUserCycles = await db.select().from(cycles).where(eq(cycles.userId, TEST_USER_ID));
    for (const cycle of testUserCycles) {
      const cycleGoals = await db.select().from(goals).where(eq(goals.cycleId, cycle.id));
      for (const goal of cycleGoals) {
        await db.delete(tactics).where(eq(tactics.goalId, goal.id));
      }
      await db.delete(goals).where(eq(goals.cycleId, cycle.id));
      await db.delete(cycles).where(eq(cycles.id, cycle.id));
    }
    
    // Clear the tracking array
    createdCycleIds.length = 0;
  } catch (error) {
    console.warn("[Test Cleanup] Error cleaning up test data:", error);
  }
}

// Cleanup after all tests in this file
afterAll(async () => {
  await cleanupTestData();
});

describe("cycle router", () => {
  it("should list cycles for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cyclesList = await caller.cycle.list();
    
    expect(Array.isArray(cyclesList)).toBe(true);
  });

  it("should create a new cycle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    const cycle = await caller.cycle.create({
      title: "Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    expect(cycle).toBeDefined();
    expect(cycle.id).toBeDefined();
    expect(cycle.title).toBe("Test Cycle");
    expect(cycle.status).toBe("planning");
  });
});

describe("goal router", () => {
  it("should list goals for a cycle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a cycle
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Goal Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    const goalsList = await caller.goal.list({ cycleId: cycle.id });
    
    expect(Array.isArray(goalsList)).toBe(true);
  });

  it("should create a new goal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a cycle
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Goal Creation Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    const goal = await caller.goal.create({
      cycleId: cycle.id,
      title: "Test Goal",
      lagIndicator: "Revenue",
      lagTarget: "$10,000",
      whyItMatters: "Financial independence",
    });

    expect(goal).toBeDefined();
    expect(goal.id).toBeDefined();
    expect(goal.title).toBe("Test Goal");
    expect(goal.lagIndicator).toBe("Revenue");
  });
});

describe("tactic router", () => {
  it("should create a tactic for a goal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create cycle and goal first
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Tactic Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    const goal = await caller.goal.create({
      cycleId: cycle.id,
      title: "Tactic Test Goal",
    });

    const tactic = await caller.tactic.create({
      goalId: goal.id,
      title: "Sales Calls",
      weeklyTarget: 20,
      totalTarget: 240,
      measurementUnit: "calls",
    });

    expect(tactic).toBeDefined();
    expect(tactic.id).toBeDefined();
    expect(tactic.title).toBe("Sales Calls");
    expect(tactic.weeklyTarget).toBe(20);
  });
});

describe("stats router", () => {
  it("should return dashboard stats for a cycle", { timeout: 15000 }, async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a cycle first
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Stats Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    const stats = await caller.stats.getDashboard({ cycleId: cycle.id });

    expect(stats).toBeDefined();
    expect(typeof stats.currentWeekScore).toBe("number");
    expect(typeof stats.averageScore).toBe("number");
    expect(stats.targetThreshold).toBe(85);
  });
});

describe("cycle ordering", () => {
  it("should prioritize cycles with goals over empty cycles", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    // Create an empty cycle first
    const emptyCycle = await caller.cycle.create({
      title: "Empty Test Cycle",
      startDate,
      endDate,
    });
    createdCycleIds.push(emptyCycle.id);

    // Create a cycle with a goal
    const cycleWithGoal = await caller.cycle.create({
      title: "Cycle With Goal",
      startDate,
      endDate,
    });
    createdCycleIds.push(cycleWithGoal.id);

    // Add a goal to the second cycle
    await caller.goal.create({
      cycleId: cycleWithGoal.id,
      title: "Test Goal for Ordering",
    });

    // List cycles - the one with goals should appear first
    const cyclesList = await caller.cycle.list();
    
    // Find positions of our test cycles
    const cycleWithGoalIndex = cyclesList.findIndex(c => c.id === cycleWithGoal.id);
    const emptyCycleIndex = cyclesList.findIndex(c => c.id === emptyCycle.id);

    // Cycle with goal should appear before empty cycle
    expect(cycleWithGoalIndex).toBeLessThan(emptyCycleIndex);
  });
});
