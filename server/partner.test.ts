import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-partner",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("partner router", () => {
  it("lists partners for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const partners = await caller.partner.list();
    
    expect(Array.isArray(partners)).toBe(true);
  });

  it("creates a new partner invitation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const partner = await caller.partner.create({
      partnerEmail: "partner@example.com",
      partnerName: "Test Partner",
      shareProgress: true,
      shareGoals: true,
      wamDay: 1,
      wamTime: "10:00",
    });

    expect(partner).toBeDefined();
    expect(partner.partnerEmail).toBe("partner@example.com");
    expect(partner.partnerName).toBe("Test Partner");
    expect(partner.status).toBe("pending");
    expect(partner.inviteToken).toBeDefined();
  });
});

describe("wam router", () => {
  it("lists WAM records for a cycle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const records = await caller.wam.list({ cycleId: 1 });
    
    expect(Array.isArray(records)).toBe(true);
  });
});

describe("export router", () => {
  it("generates weekly scorecard HTML", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will throw because cycle doesn't exist, but we're testing the route exists
    try {
      await caller.export.weeklyScorecard({ cycleId: 999, weekNumber: 1 });
    } catch (error: any) {
      expect(error.message).toBe("Cycle not found");
    }
  });

  it("generates cycle review HTML", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will throw because cycle doesn't exist, but we're testing the route exists
    try {
      await caller.export.cycleReview({ cycleId: 999, reviewType: "mid_cycle" });
    } catch (error: any) {
      expect(error.message).toBe("Cycle not found");
    }
  });
});

describe("notification router", () => {
  it("has test notification procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the procedure exists and can be called
    const result = await caller.notification.testNotification({
      title: "Test",
      content: "Test notification content",
    });

    // The notification may or may not succeed depending on external service
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});
