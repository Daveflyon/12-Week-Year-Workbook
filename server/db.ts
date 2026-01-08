import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  cycles, InsertCycle, Cycle,
  visions, InsertVision, Vision,
  goals, InsertGoal, Goal,
  tactics, InsertTactic, Tactic,
  tacticEntries, InsertTacticEntry, TacticEntry,
  weeklyScores, InsertWeeklyScore, WeeklyScore,
  weeklyReviews, InsertWeeklyReview, WeeklyReview,
  performanceBlocks, InsertPerformanceBlock, PerformanceBlock,
  checklistItems, InsertChecklistItem, ChecklistItem,
  cycleReviews, InsertCycleReview, CycleReview,
  reminderSettings, InsertReminderSetting, ReminderSetting,
  flashcardViews, InsertFlashcardView,
  accountabilityPartners, InsertAccountabilityPartner, AccountabilityPartner,
  wamRecords, InsertWamRecord, WamRecord
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Cycle functions
export async function createCycle(cycle: InsertCycle): Promise<Cycle> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cycles).values(cycle);
  const insertId = result[0].insertId;
  const created = await db.select().from(cycles).where(eq(cycles.id, insertId)).limit(1);
  return created[0];
}

// Extended Cycle type with goal count for UI display
export type CycleWithGoalCount = Cycle & { goalCount: number };

export async function getCyclesByUser(userId: number): Promise<CycleWithGoalCount[]> {
  const db = await getDb();
  if (!db) return [];
  // Order by: cycles with goals first (active status preferred), then by creation date (newest first)
  const result = await db.execute(sql`
    SELECT c.*, 
           (SELECT COUNT(*) FROM goals WHERE cycleId = c.id) as goalCount
    FROM cycles c
    WHERE c.userId = ${userId}
    ORDER BY 
      CASE WHEN c.status = 'active' AND (SELECT COUNT(*) FROM goals WHERE cycleId = c.id) > 0 THEN 0
           WHEN (SELECT COUNT(*) FROM goals WHERE cycleId = c.id) > 0 THEN 1
           WHEN c.status = 'active' THEN 2
           ELSE 3
      END,
      (SELECT COUNT(*) FROM goals WHERE cycleId = c.id) DESC,
      c.createdAt DESC
  `) as unknown as [any[], any];
  // mysql2 returns [rows, fields], so result[0] contains the rows
  const rows = result[0];
  // Map the raw result to CycleWithGoalCount type
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    goalCount: Number(row.goalCount) || 0
  }));
}

export async function getCycleById(cycleId: number, userId: number): Promise<Cycle | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cycles).where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId))).limit(1);
  return result[0];
}

export async function updateCycle(cycleId: number, userId: number, data: Partial<InsertCycle>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(cycles).set(data).where(and(eq(cycles.id, cycleId), eq(cycles.userId, userId)));
}

// Vision functions
export async function upsertVision(vision: InsertVision): Promise<Vision> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(visions).where(and(eq(visions.cycleId, vision.cycleId), eq(visions.userId, vision.userId))).limit(1);
  if (existing.length > 0) {
    await db.update(visions).set(vision).where(eq(visions.id, existing[0].id));
    const updated = await db.select().from(visions).where(eq(visions.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(visions).values(vision);
    const created = await db.select().from(visions).where(eq(visions.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getVisionByCycle(cycleId: number, userId: number): Promise<Vision | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(visions).where(and(eq(visions.cycleId, cycleId), eq(visions.userId, userId))).limit(1);
  return result[0];
}

// Goal functions
export async function createGoal(goal: InsertGoal): Promise<Goal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(goals).values(goal);
  const created = await db.select().from(goals).where(eq(goals.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getGoalsByCycle(cycleId: number, userId: number): Promise<Goal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(and(eq(goals.cycleId, cycleId), eq(goals.userId, userId))).orderBy(goals.orderIndex);
}

export async function updateGoal(goalId: number, userId: number, data: Partial<InsertGoal>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(goals).set(data).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}

export async function deleteGoal(goalId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}

// Tactic functions
export async function createTactic(tactic: InsertTactic): Promise<Tactic> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tactics).values(tactic);
  const created = await db.select().from(tactics).where(eq(tactics.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getTacticsByGoal(goalId: number, userId: number): Promise<Tactic[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tactics).where(and(eq(tactics.goalId, goalId), eq(tactics.userId, userId))).orderBy(tactics.orderIndex);
}

export async function getTacticsByCycle(cycleId: number, userId: number): Promise<(Tactic & { goalTitle: string })[]> {
  const db = await getDb();
  if (!db) return [];
  const cycleGoals = await getGoalsByCycle(cycleId, userId);
  const allTactics: (Tactic & { goalTitle: string })[] = [];
  for (const goal of cycleGoals) {
    const goalTactics = await getTacticsByGoal(goal.id, userId);
    allTactics.push(...goalTactics.map(t => ({ ...t, goalTitle: goal.title })));
  }
  return allTactics;
}

export async function updateTactic(tacticId: number, userId: number, data: Partial<InsertTactic>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tactics).set(data).where(and(eq(tactics.id, tacticId), eq(tactics.userId, userId)));
}

export async function deleteTactic(tacticId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tactics).where(and(eq(tactics.id, tacticId), eq(tactics.userId, userId)));
}

// Tactic Entry functions
export async function upsertTacticEntry(entry: InsertTacticEntry): Promise<TacticEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(tacticEntries).where(
    and(
      eq(tacticEntries.tacticId, entry.tacticId),
      eq(tacticEntries.userId, entry.userId),
      eq(tacticEntries.weekNumber, entry.weekNumber),
      eq(tacticEntries.dayOfWeek, entry.dayOfWeek)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(tacticEntries).set(entry).where(eq(tacticEntries.id, existing[0].id));
    const updated = await db.select().from(tacticEntries).where(eq(tacticEntries.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(tacticEntries).values(entry);
    const created = await db.select().from(tacticEntries).where(eq(tacticEntries.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getTacticEntriesByWeek(tacticId: number, userId: number, weekNumber: number): Promise<TacticEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tacticEntries).where(
    and(eq(tacticEntries.tacticId, tacticId), eq(tacticEntries.userId, userId), eq(tacticEntries.weekNumber, weekNumber))
  ).orderBy(tacticEntries.dayOfWeek);
}

export async function getAllTacticEntriesForCycle(cycleId: number, userId: number): Promise<TacticEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const cycleTactics = await getTacticsByCycle(cycleId, userId);
  const tacticIds = cycleTactics.map(t => t.id);
  if (tacticIds.length === 0) return [];
  const allEntries: TacticEntry[] = [];
  for (const tacticId of tacticIds) {
    const entries = await db.select().from(tacticEntries).where(
      and(eq(tacticEntries.tacticId, tacticId), eq(tacticEntries.userId, userId))
    );
    allEntries.push(...entries);
  }
  return allEntries;
}

// Weekly Score functions
export async function upsertWeeklyScore(score: InsertWeeklyScore): Promise<WeeklyScore> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(weeklyScores).where(
    and(eq(weeklyScores.cycleId, score.cycleId), eq(weeklyScores.userId, score.userId), eq(weeklyScores.weekNumber, score.weekNumber))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(weeklyScores).set(score).where(eq(weeklyScores.id, existing[0].id));
    const updated = await db.select().from(weeklyScores).where(eq(weeklyScores.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(weeklyScores).values(score);
    const created = await db.select().from(weeklyScores).where(eq(weeklyScores.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getWeeklyScoresByCycle(cycleId: number, userId: number): Promise<WeeklyScore[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyScores).where(and(eq(weeklyScores.cycleId, cycleId), eq(weeklyScores.userId, userId))).orderBy(weeklyScores.weekNumber);
}

export async function getWeeklyScore(cycleId: number, userId: number, weekNumber: number): Promise<WeeklyScore | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(weeklyScores).where(
    and(eq(weeklyScores.cycleId, cycleId), eq(weeklyScores.userId, userId), eq(weeklyScores.weekNumber, weekNumber))
  ).limit(1);
  return result[0];
}

// Weekly Review functions
export async function upsertWeeklyReview(review: InsertWeeklyReview): Promise<WeeklyReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(weeklyReviews).where(
    and(eq(weeklyReviews.cycleId, review.cycleId), eq(weeklyReviews.userId, review.userId), eq(weeklyReviews.weekNumber, review.weekNumber))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(weeklyReviews).set(review).where(eq(weeklyReviews.id, existing[0].id));
    const updated = await db.select().from(weeklyReviews).where(eq(weeklyReviews.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(weeklyReviews).values(review);
    const created = await db.select().from(weeklyReviews).where(eq(weeklyReviews.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getWeeklyReview(cycleId: number, userId: number, weekNumber: number): Promise<WeeklyReview | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(weeklyReviews).where(
    and(eq(weeklyReviews.cycleId, cycleId), eq(weeklyReviews.userId, userId), eq(weeklyReviews.weekNumber, weekNumber))
  ).limit(1);
  return result[0];
}

// Performance Block functions
export async function createPerformanceBlock(block: InsertPerformanceBlock): Promise<PerformanceBlock> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performanceBlocks).values(block);
  const created = await db.select().from(performanceBlocks).where(eq(performanceBlocks.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getPerformanceBlocksByCycle(cycleId: number, userId: number): Promise<PerformanceBlock[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(performanceBlocks).where(and(eq(performanceBlocks.cycleId, cycleId), eq(performanceBlocks.userId, userId))).orderBy(performanceBlocks.dayOfWeek, performanceBlocks.startTime);
}

export async function updatePerformanceBlock(blockId: number, userId: number, data: Partial<InsertPerformanceBlock>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(performanceBlocks).set(data).where(and(eq(performanceBlocks.id, blockId), eq(performanceBlocks.userId, userId)));
}

export async function deletePerformanceBlock(blockId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(performanceBlocks).where(and(eq(performanceBlocks.id, blockId), eq(performanceBlocks.userId, userId)));
}

// Checklist functions
export async function initializeChecklist(cycleId: number, userId: number): Promise<ChecklistItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const defaultItems = [
    { itemKey: "vision_reviewed", itemLabel: "Reviewed your 3-5 year vision to ensure new goals are aligned" },
    { itemKey: "goal_limit_set", itemLabel: "Limited the number of primary 12-Week Goals to a maximum of 3" },
    { itemKey: "tactics_quantified", itemLabel: "Every Lead Indicator is a specific, measurable action" },
    { itemKey: "strategic_blocks_scheduled", itemLabel: "Blocked out Strategic Blocks (3+ hours of deep work) for the first 3 weeks" },
    { itemKey: "execution_target_set", itemLabel: "Committed to the 85% Execution Score as your primary measure of success" },
    { itemKey: "perfectionism_rejected", itemLabel: "Mentally accepted that the goal is consistent effort (85%), not flawless execution (100%)" },
    { itemKey: "cycle_start_confirmed", itemLabel: "Confirmed the exact start date for Week 1, Day 1" },
    { itemKey: "commitment_statement_written", itemLabel: "Written a personal commitment statement focusing on the 3 Principles" },
  ];
  const items: ChecklistItem[] = [];
  for (const item of defaultItems) {
    const result = await db.insert(checklistItems).values({ userId, cycleId, ...item });
    const created = await db.select().from(checklistItems).where(eq(checklistItems.id, result[0].insertId)).limit(1);
    items.push(created[0]);
  }
  return items;
}

export async function getChecklistByCycle(cycleId: number, userId: number): Promise<ChecklistItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(and(eq(checklistItems.cycleId, cycleId), eq(checklistItems.userId, userId)));
}

export async function updateChecklistItem(itemId: number, userId: number, isCompleted: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(checklistItems).set({ isCompleted, completedAt: isCompleted ? new Date() : null }).where(and(eq(checklistItems.id, itemId), eq(checklistItems.userId, userId)));
}

// Cycle Review functions
export async function upsertCycleReview(review: InsertCycleReview): Promise<CycleReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(cycleReviews).where(
    and(eq(cycleReviews.cycleId, review.cycleId), eq(cycleReviews.userId, review.userId), eq(cycleReviews.reviewType, review.reviewType))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(cycleReviews).set(review).where(eq(cycleReviews.id, existing[0].id));
    const updated = await db.select().from(cycleReviews).where(eq(cycleReviews.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(cycleReviews).values(review);
    const created = await db.select().from(cycleReviews).where(eq(cycleReviews.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getCycleReview(cycleId: number, userId: number, reviewType: "mid_cycle" | "final"): Promise<CycleReview | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cycleReviews).where(
    and(eq(cycleReviews.cycleId, cycleId), eq(cycleReviews.userId, userId), eq(cycleReviews.reviewType, reviewType))
  ).limit(1);
  return result[0];
}

// Reminder Settings functions
export async function upsertReminderSettings(settings: InsertReminderSetting): Promise<ReminderSetting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(reminderSettings).where(eq(reminderSettings.userId, settings.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(reminderSettings).set(settings).where(eq(reminderSettings.id, existing[0].id));
    const updated = await db.select().from(reminderSettings).where(eq(reminderSettings.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(reminderSettings).values(settings);
    const created = await db.select().from(reminderSettings).where(eq(reminderSettings.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

export async function getReminderSettings(userId: number): Promise<ReminderSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reminderSettings).where(eq(reminderSettings.userId, userId)).limit(1);
  return result[0];
}

// Flashcard View functions
export async function recordFlashcardView(view: InsertFlashcardView): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(flashcardViews).values(view);
}

export async function getRecentFlashcardViews(userId: number, limit: number = 10): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ flashcardKey: flashcardViews.flashcardKey }).from(flashcardViews).where(eq(flashcardViews.userId, userId)).orderBy(desc(flashcardViews.viewedAt)).limit(limit);
  return result.map(r => r.flashcardKey);
}

// Aggregate statistics for progress comparison
export async function getGlobalAverageExecutionScore(): Promise<number> {
  const db = await getDb();
  if (!db) return 85;
  const result = await db.select({ avg: sql<number>`AVG(CAST(${weeklyScores.executionScore} AS DECIMAL(5,2)))` }).from(weeklyScores);
  return result[0]?.avg ?? 85;
}

export async function getUserAverageExecutionScore(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ avg: sql<number>`AVG(CAST(${weeklyScores.executionScore} AS DECIMAL(5,2)))` }).from(weeklyScores).where(eq(weeklyScores.userId, userId));
  return result[0]?.avg ?? 0;
}

// Accountability Partner functions
export async function createPartner(partner: InsertAccountabilityPartner): Promise<AccountabilityPartner> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accountabilityPartners).values(partner);
  const created = await db.select().from(accountabilityPartners).where(eq(accountabilityPartners.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getPartnersByUser(userId: number): Promise<AccountabilityPartner[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accountabilityPartners).where(eq(accountabilityPartners.userId, userId));
}

export async function getPartnerByToken(token: string): Promise<AccountabilityPartner | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountabilityPartners).where(eq(accountabilityPartners.inviteToken, token)).limit(1);
  return result[0];
}

export async function updatePartner(id: number, userId: number, data: Partial<InsertAccountabilityPartner>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(accountabilityPartners).set(data).where(and(eq(accountabilityPartners.id, id), eq(accountabilityPartners.userId, userId)));
}

export async function deletePartner(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(accountabilityPartners).where(and(eq(accountabilityPartners.id, id), eq(accountabilityPartners.userId, userId)));
}

export async function getPartnerById(id: number, userId: number): Promise<AccountabilityPartner | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accountabilityPartners).where(and(eq(accountabilityPartners.id, id), eq(accountabilityPartners.userId, userId))).limit(1);
  return result[0];
}

// WAM Record functions
export async function createWamRecord(record: InsertWamRecord): Promise<WamRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(wamRecords).values(record);
  const created = await db.select().from(wamRecords).where(eq(wamRecords.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getWamRecordsByCycle(cycleId: number, userId: number): Promise<WamRecord[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wamRecords).where(and(eq(wamRecords.cycleId, cycleId), eq(wamRecords.userId, userId))).orderBy(wamRecords.weekNumber);
}

export async function getWamRecord(cycleId: number, userId: number, weekNumber: number): Promise<WamRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wamRecords).where(
    and(eq(wamRecords.cycleId, cycleId), eq(wamRecords.userId, userId), eq(wamRecords.weekNumber, weekNumber))
  ).limit(1);
  return result[0];
}

export async function upsertWamRecord(record: InsertWamRecord): Promise<WamRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(wamRecords).where(
    and(eq(wamRecords.cycleId, record.cycleId), eq(wamRecords.userId, record.userId), eq(wamRecords.weekNumber, record.weekNumber))
  ).limit(1);
  if (existing.length > 0) {
    await db.update(wamRecords).set(record).where(eq(wamRecords.id, existing[0].id));
    const updated = await db.select().from(wamRecords).where(eq(wamRecords.id, existing[0].id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(wamRecords).values(record);
    const created = await db.select().from(wamRecords).where(eq(wamRecords.id, result[0].insertId)).limit(1);
    return created[0];
  }
}

// Get shared progress for a partner (what they can see about the user)
export async function getSharedProgressForPartner(userId: number, cycleId: number): Promise<{
  weeklyScores: WeeklyScore[];
  goals: Goal[];
}> {
  const db = await getDb();
  if (!db) return { weeklyScores: [], goals: [] };
  
  const scores = await db.select().from(weeklyScores).where(
    and(eq(weeklyScores.userId, userId), eq(weeklyScores.cycleId, cycleId))
  ).orderBy(weeklyScores.weekNumber);
  
  const userGoals = await db.select().from(goals).where(
    and(eq(goals.userId, userId), eq(goals.cycleId, cycleId))
  );
  
  return { weeklyScores: scores, goals: userGoals };
}
