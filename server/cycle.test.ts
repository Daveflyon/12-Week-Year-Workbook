import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-12wy",
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

describe("cycle router", () => {
  it("should list cycles for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cycles = await caller.cycle.list();
    
    expect(Array.isArray(cycles)).toBe(true);
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

    const goals = await caller.goal.list({ cycleId: cycle.id });
    
    expect(Array.isArray(goals)).toBe(true);
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

    const stats = await caller.stats.getDashboard({ cycleId: cycle.id });

    expect(stats).toBeDefined();
    expect(typeof stats.currentWeekScore).toBe("number");
    expect(typeof stats.averageScore).toBe("number");
    expect(stats.targetThreshold).toBe(85);
  });
});
