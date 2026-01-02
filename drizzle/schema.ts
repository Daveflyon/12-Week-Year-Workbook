import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

// Core user table backing auth flow
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 12-Week Cycles
export const cycles = mysqlTable("cycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["planning", "active", "completed", "archived"]).default("planning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cycle = typeof cycles.$inferSelect;
export type InsertCycle = typeof cycles.$inferInsert;

// Vision statements
export const visions = mysqlTable("visions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  longTermVision: text("longTermVision"), // 3-5 year vision
  strategicImperatives: json("strategicImperatives"), // Array of 2-3 key focus areas
  commitmentStatement: text("commitmentStatement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vision = typeof visions.$inferSelect;
export type InsertVision = typeof visions.$inferInsert;

// Goals (1-3 per cycle)
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lagIndicator: text("lagIndicator"), // The result metric
  lagTarget: varchar("lagTarget", { length: 255 }), // Target value
  lagCurrentValue: varchar("lagCurrentValue", { length: 255 }), // Current progress
  whyItMatters: text("whyItMatters"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

// Lead Indicators (Tactics) for each goal
export const tactics = mysqlTable("tactics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  goalId: int("goalId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  weeklyTarget: int("weeklyTarget").notNull(),
  totalTarget: int("totalTarget").notNull(), // 12-week total
  measurementUnit: varchar("measurementUnit", { length: 100 }),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tactic = typeof tactics.$inferSelect;
export type InsertTactic = typeof tactics.$inferInsert;

// Daily tactic completions
export const tacticEntries = mysqlTable("tacticEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tacticId: int("tacticId").notNull(),
  weekNumber: int("weekNumber").notNull(), // 1-12
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 1=Monday, etc.
  date: timestamp("date").notNull(),
  completed: int("completed").default(0).notNull(), // Quantity completed
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TacticEntry = typeof tacticEntries.$inferSelect;
export type InsertTacticEntry = typeof tacticEntries.$inferInsert;

// Weekly scorecards
export const weeklyScores = mysqlTable("weeklyScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  weekNumber: int("weekNumber").notNull(), // 1-12
  executionScore: decimal("executionScore", { precision: 5, scale: 2 }), // Percentage
  strategicBlocksPlanned: int("strategicBlocksPlanned").default(0),
  strategicBlocksCompleted: int("strategicBlocksCompleted").default(0),
  bufferBlocksPlanned: int("bufferBlocksPlanned").default(0),
  bufferBlocksCompleted: int("bufferBlocksCompleted").default(0),
  breakoutBlocksPlanned: int("breakoutBlocksPlanned").default(0),
  breakoutBlocksCompleted: int("breakoutBlocksCompleted").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyScore = typeof weeklyScores.$inferSelect;
export type InsertWeeklyScore = typeof weeklyScores.$inferInsert;

// Weekly reviews and reflections
export const weeklyReviews = mysqlTable("weeklyReviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  weekNumber: int("weekNumber").notNull(),
  whatWorkedWell: text("whatWorkedWell"),
  whatDidNotWork: text("whatDidNotWork"),
  adjustmentsForNextWeek: text("adjustmentsForNextWeek"),
  wamCompleted: boolean("wamCompleted").default(false),
  wamNotes: text("wamNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type InsertWeeklyReview = typeof weeklyReviews.$inferInsert;

// Performance blocks
export const performanceBlocks = mysqlTable("performanceBlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  blockType: mysqlEnum("blockType", ["strategic", "buffer", "breakout"]).notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6
  startTime: varchar("startTime", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 10 }).notNull(),
  description: text("description"),
  isRecurring: boolean("isRecurring").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceBlock = typeof performanceBlocks.$inferSelect;
export type InsertPerformanceBlock = typeof performanceBlocks.$inferInsert;

// Pre-cycle checklist items
export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  itemKey: varchar("itemKey", { length: 100 }).notNull(),
  itemLabel: varchar("itemLabel", { length: 500 }).notNull(),
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

// Mid-cycle and final reviews
export const cycleReviews = mysqlTable("cycleReviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleId: int("cycleId").notNull(),
  reviewType: mysqlEnum("reviewType", ["mid_cycle", "final"]).notNull(),
  averageExecutionScore: decimal("averageExecutionScore", { precision: 5, scale: 2 }),
  lagIndicatorProgress: json("lagIndicatorProgress"), // JSON object with goal progress
  greatestSuccess: text("greatestSuccess"),
  biggestObstacle: text("biggestObstacle"),
  mostEffectiveTactic: text("mostEffectiveTactic"),
  pitfallsEncountered: text("pitfallsEncountered"),
  adjustmentsForNextCycle: text("adjustmentsForNextCycle"),
  lessonsLearned: text("lessonsLearned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CycleReview = typeof cycleReviews.$inferSelect;
export type InsertCycleReview = typeof cycleReviews.$inferInsert;

// User reminder preferences
export const reminderSettings = mysqlTable("reminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dailyReminderTime: varchar("dailyReminderTime", { length: 10 }), // HH:MM format
  weeklyReviewDay: int("weeklyReviewDay").default(0), // 0=Sunday
  weeklyReviewTime: varchar("weeklyReviewTime", { length: 10 }),
  enableDailyReminders: boolean("enableDailyReminders").default(true),
  enableWeeklyReminders: boolean("enableWeeklyReminders").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReminderSetting = typeof reminderSettings.$inferSelect;
export type InsertReminderSetting = typeof reminderSettings.$inferInsert;

// Flashcard views (to track which flashcards user has seen)
export const flashcardViews = mysqlTable("flashcardViews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flashcardKey: varchar("flashcardKey", { length: 100 }).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  context: varchar("context", { length: 100 }), // Where it was shown (dashboard, scorecard, etc.)
});

export type FlashcardView = typeof flashcardViews.$inferSelect;
export type InsertFlashcardView = typeof flashcardViews.$inferInsert;

// Accountability Partners
export const accountabilityPartners = mysqlTable("accountabilityPartners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The user who owns this partnership
  partnerEmail: varchar("partnerEmail", { length: 320 }).notNull(),
  partnerName: varchar("partnerName", { length: 255 }),
  partnerUserId: int("partnerUserId"), // If the partner is also a user
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  shareProgress: boolean("shareProgress").default(true), // Share execution scores
  shareGoals: boolean("shareGoals").default(true), // Share goal details
  wamDay: int("wamDay").default(0), // Day of week for WAM (0=Sunday)
  wamTime: varchar("wamTime", { length: 10 }), // HH:MM format
  inviteToken: varchar("inviteToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountabilityPartner = typeof accountabilityPartners.$inferSelect;
export type InsertAccountabilityPartner = typeof accountabilityPartners.$inferInsert;

// WAM (Weekly Accountability Meeting) Records
export const wamRecords = mysqlTable("wamRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  partnerId: int("partnerId"), // Reference to accountabilityPartners
  cycleId: int("cycleId").notNull(),
  weekNumber: int("weekNumber").notNull(),
  meetingDate: timestamp("meetingDate"),
  executionScoreShared: decimal("executionScoreShared", { precision: 5, scale: 2 }),
  winsShared: text("winsShared"),
  challengesShared: text("challengesShared"),
  commitmentsForNextWeek: text("commitmentsForNextWeek"),
  partnerFeedback: text("partnerFeedback"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WamRecord = typeof wamRecords.$inferSelect;
export type InsertWamRecord = typeof wamRecords.$inferInsert;
