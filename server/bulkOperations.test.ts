import { describe, it, expect, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { cycles, goals, tactics, performanceBlocks, checklistItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use a unique test user ID to isolate test data
const TEST_USER_ID = 999998;
const TEST_USER_OPEN_ID = "test-user-bulk-ops-cleanup";

// Track created test cycles for cleanup
const createdCycleIds: number[] = [];

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: TEST_USER_ID,
    openId: TEST_USER_OPEN_ID,
    email: "bulk-test@example.com",
    name: "Bulk Test User",
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
    // Delete related data for test cycles
    for (const cycleId of createdCycleIds) {
      // Delete performance blocks
      await db.delete(performanceBlocks).where(eq(performanceBlocks.cycleId, cycleId));
      
      // Delete checklist items
      await db.delete(checklistItems).where(eq(checklistItems.cycleId, cycleId));
      
      // Delete tactics for goals in this cycle
      const cycleGoals = await db.select().from(goals).where(eq(goals.cycleId, cycleId));
      for (const goal of cycleGoals) {
        await db.delete(tactics).where(eq(tactics.goalId, goal.id));
      }
      
      // Delete goals
      await db.delete(goals).where(eq(goals.cycleId, cycleId));
    }
    
    // Delete test cycles
    for (const cycleId of createdCycleIds) {
      await db.delete(cycles).where(eq(cycles.id, cycleId));
    }
    
    // Also clean up any cycles created by the test user that might have been missed
    const testUserCycles = await db.select().from(cycles).where(eq(cycles.userId, TEST_USER_ID));
    for (const cycle of testUserCycles) {
      await db.delete(performanceBlocks).where(eq(performanceBlocks.cycleId, cycle.id));
      await db.delete(checklistItems).where(eq(checklistItems.cycleId, cycle.id));
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

describe("performanceBlock.bulkUpdate", () => {
  it("should create blocks on multiple days when source block exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a cycle first
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Bulk Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    // Create a source block on Monday
    const sourceBlock = await caller.performanceBlock.create({
      cycleId: cycle.id,
      blockType: "strategic",
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "12:00",
      description: "Deep work session",
    });

    // Bulk update to apply to weekdays (Tue-Fri)
    const result = await caller.performanceBlock.bulkUpdate({
      cycleId: cycle.id,
      sourceBlockId: sourceBlock.id,
      targetDays: [2, 3, 4, 5], // Tue, Wed, Thu, Fri
      blockType: "strategic",
      startTime: "09:00",
      endTime: "12:00",
      description: "Deep work session",
    });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(4);

    // Verify blocks were created
    const blocks = await caller.performanceBlock.list({ cycleId: cycle.id });
    expect(blocks.length).toBe(5); // Original + 4 new

    // Verify all blocks have correct properties
    const strategicBlocks = blocks.filter(b => b.blockType === "strategic");
    expect(strategicBlocks.length).toBe(5);
    strategicBlocks.forEach(block => {
      expect(block.startTime).toBe("09:00");
      expect(block.endTime).toBe("12:00");
    });
  }, 30000); // 30 second timeout

  it("should update existing blocks on target days", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a cycle
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Bulk Update Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    // Create blocks on Monday and Tuesday
    const mondayBlock = await caller.performanceBlock.create({
      cycleId: cycle.id,
      blockType: "buffer",
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "15:00",
      description: "Admin time",
    });

    await caller.performanceBlock.create({
      cycleId: cycle.id,
      blockType: "buffer",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "15:00",
      description: "Admin time",
    });

    // Update both blocks via bulk update
    const result = await caller.performanceBlock.bulkUpdate({
      cycleId: cycle.id,
      sourceBlockId: mondayBlock.id,
      targetDays: [1, 2],
      description: "Updated admin time",
      endTime: "16:00",
    });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);

    // Verify updates
    const blocks = await caller.performanceBlock.list({ cycleId: cycle.id });
    const bufferBlocks = blocks.filter(b => b.blockType === "buffer");
    expect(bufferBlocks.length).toBe(2);
    bufferBlocks.forEach(block => {
      expect(block.endTime).toBe("16:00");
      expect(block.description).toBe("Updated admin time");
    });
  }, 30000); // 30 second timeout
});

describe("checklist bulk operations", () => {
  it("should update multiple checklist items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a cycle to get checklist items
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84);

    const cycle = await caller.cycle.create({
      title: "Checklist Bulk Test Cycle",
      startDate,
      endDate,
    });

    // Track for cleanup
    createdCycleIds.push(cycle.id);

    // Get checklist items
    const checklist = await caller.checklist.get({ cycleId: cycle.id });
    expect(checklist.length).toBeGreaterThan(0);

    // Update first two items to completed
    await caller.checklist.update({ itemId: checklist[0].id, isCompleted: true });
    await caller.checklist.update({ itemId: checklist[1].id, isCompleted: true });

    // Verify updates
    const updatedChecklist = await caller.checklist.get({ cycleId: cycle.id });
    expect(updatedChecklist[0].isCompleted).toBe(true);
    expect(updatedChecklist[1].isCompleted).toBe(true);

    // Uncheck them
    await caller.checklist.update({ itemId: checklist[0].id, isCompleted: false });
    await caller.checklist.update({ itemId: checklist[1].id, isCompleted: false });

    // Verify unchecked
    const finalChecklist = await caller.checklist.get({ cycleId: cycle.id });
    expect(finalChecklist[0].isCompleted).toBe(false);
    expect(finalChecklist[1].isCompleted).toBe(false);
  }, 30000); // 30 second timeout
});
