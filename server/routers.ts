import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { generateScorecardHTML, generateCycleReviewHTML } from "./pdfExport";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Cycle management
  cycle: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCyclesByUser(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCycleById(input.cycleId, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const cycle = await db.createCycle({
          userId: ctx.user.id,
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "planning",
        });
        // Initialize checklist for the new cycle
        await db.initializeChecklist(cycle.id, ctx.user.id);
        return cycle;
      }),
    
    update: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        title: z.string().optional(),
        status: z.enum(["planning", "active", "completed", "archived"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { cycleId, ...data } = input;
        await db.updateCycle(cycleId, ctx.user.id, data);
        return { success: true };
      }),
  }),

  // Vision management
  vision: router({
    get: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const vision = await db.getVisionByCycle(input.cycleId, ctx.user.id);
        return vision ?? null;
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        longTermVision: z.string().optional(),
        strategicImperatives: z.array(z.string()).optional(),
        commitmentStatement: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertVision({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          longTermVision: input.longTermVision,
          strategicImperatives: input.strategicImperatives,
          commitmentStatement: input.commitmentStatement,
        });
      }),
  }),

  // Goal management
  goal: router({
    list: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getGoalsByCycle(input.cycleId, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        title: z.string().min(1),
        lagIndicator: z.string().optional(),
        lagTarget: z.string().optional(),
        whyItMatters: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createGoal({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          title: input.title,
          lagIndicator: input.lagIndicator,
          lagTarget: input.lagTarget,
          whyItMatters: input.whyItMatters,
          orderIndex: input.orderIndex ?? 0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        title: z.string().optional(),
        lagIndicator: z.string().optional(),
        lagTarget: z.string().optional(),
        lagCurrentValue: z.string().optional(),
        whyItMatters: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { goalId, ...data } = input;
        await db.updateGoal(goalId, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteGoal(input.goalId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Tactic management
  tactic: router({
    listByGoal: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTacticsByGoal(input.goalId, ctx.user.id);
      }),
    
    listByCycle: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTacticsByCycle(input.cycleId, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        title: z.string().min(1),
        weeklyTarget: z.number().min(1),
        totalTarget: z.number().min(1),
        measurementUnit: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTactic({
          userId: ctx.user.id,
          goalId: input.goalId,
          title: input.title,
          weeklyTarget: input.weeklyTarget,
          totalTarget: input.totalTarget,
          measurementUnit: input.measurementUnit,
          orderIndex: input.orderIndex ?? 0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        tacticId: z.number(),
        title: z.string().optional(),
        weeklyTarget: z.number().optional(),
        totalTarget: z.number().optional(),
        measurementUnit: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { tacticId, ...data } = input;
        await db.updateTactic(tacticId, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ tacticId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTactic(input.tacticId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Tactic entry (daily tracking)
  tacticEntry: router({
    getByWeek: protectedProcedure
      .input(z.object({ tacticId: z.number(), weekNumber: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTacticEntriesByWeek(input.tacticId, ctx.user.id, input.weekNumber);
      }),
    
    getAllForCycle: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getAllTacticEntriesForCycle(input.cycleId, ctx.user.id);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        tacticId: z.number(),
        weekNumber: z.number(),
        dayOfWeek: z.number().min(0).max(6),
        date: z.date(),
        completed: z.number().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertTacticEntry({
          userId: ctx.user.id,
          tacticId: input.tacticId,
          weekNumber: input.weekNumber,
          dayOfWeek: input.dayOfWeek,
          date: input.date,
          completed: input.completed,
          notes: input.notes,
        });
      }),
  }),

  // Weekly score management
  weeklyScore: router({
    getByCycle: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWeeklyScoresByCycle(input.cycleId, ctx.user.id);
      }),
    
    get: protectedProcedure
      .input(z.object({ cycleId: z.number(), weekNumber: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWeeklyScore(input.cycleId, ctx.user.id, input.weekNumber);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        weekNumber: z.number(),
        executionScore: z.string(),
        strategicBlocksPlanned: z.number().optional(),
        strategicBlocksCompleted: z.number().optional(),
        bufferBlocksPlanned: z.number().optional(),
        bufferBlocksCompleted: z.number().optional(),
        breakoutBlocksPlanned: z.number().optional(),
        breakoutBlocksCompleted: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertWeeklyScore({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          weekNumber: input.weekNumber,
          executionScore: input.executionScore,
          strategicBlocksPlanned: input.strategicBlocksPlanned,
          strategicBlocksCompleted: input.strategicBlocksCompleted,
          bufferBlocksPlanned: input.bufferBlocksPlanned,
          bufferBlocksCompleted: input.bufferBlocksCompleted,
          breakoutBlocksPlanned: input.breakoutBlocksPlanned,
          breakoutBlocksCompleted: input.breakoutBlocksCompleted,
        });
      }),
  }),

  // Weekly review management
  weeklyReview: router({
    get: protectedProcedure
      .input(z.object({ cycleId: z.number(), weekNumber: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWeeklyReview(input.cycleId, ctx.user.id, input.weekNumber);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        weekNumber: z.number(),
        whatWorkedWell: z.string().optional(),
        whatDidNotWork: z.string().optional(),
        adjustmentsForNextWeek: z.string().optional(),
        wamCompleted: z.boolean().optional(),
        wamNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertWeeklyReview({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          weekNumber: input.weekNumber,
          whatWorkedWell: input.whatWorkedWell,
          whatDidNotWork: input.whatDidNotWork,
          adjustmentsForNextWeek: input.adjustmentsForNextWeek,
          wamCompleted: input.wamCompleted,
          wamNotes: input.wamNotes,
        });
      }),
  }),

  // Performance block management
  performanceBlock: router({
    list: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getPerformanceBlocksByCycle(input.cycleId, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        blockType: z.enum(["strategic", "buffer", "breakout"]),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        description: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPerformanceBlock({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          blockType: input.blockType,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          description: input.description,
          isRecurring: input.isRecurring ?? true,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        blockId: z.number(),
        blockType: z.enum(["strategic", "buffer", "breakout"]).optional(),
        dayOfWeek: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        description: z.string().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { blockId, ...data } = input;
        await db.updatePerformanceBlock(blockId, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ blockId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePerformanceBlock(input.blockId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Checklist management
  checklist: router({
    get: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getChecklistByCycle(input.cycleId, ctx.user.id);
      }),
    
    update: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        isCompleted: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChecklistItem(input.itemId, ctx.user.id, input.isCompleted);
        return { success: true };
      }),
  }),

  // Cycle review management (mid-cycle and final)
  cycleReview: router({
    get: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        reviewType: z.enum(["mid_cycle", "final"]),
      }))
      .query(async ({ ctx, input }) => {
        return db.getCycleReview(input.cycleId, ctx.user.id, input.reviewType);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        reviewType: z.enum(["mid_cycle", "final"]),
        averageExecutionScore: z.string().optional(),
        lagIndicatorProgress: z.any().optional(),
        greatestSuccess: z.string().optional(),
        biggestObstacle: z.string().optional(),
        mostEffectiveTactic: z.string().optional(),
        pitfallsEncountered: z.string().optional(),
        adjustmentsForNextCycle: z.string().optional(),
        lessonsLearned: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertCycleReview({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          reviewType: input.reviewType,
          averageExecutionScore: input.averageExecutionScore,
          lagIndicatorProgress: input.lagIndicatorProgress,
          greatestSuccess: input.greatestSuccess,
          biggestObstacle: input.biggestObstacle,
          mostEffectiveTactic: input.mostEffectiveTactic,
          pitfallsEncountered: input.pitfallsEncountered,
          adjustmentsForNextCycle: input.adjustmentsForNextCycle,
          lessonsLearned: input.lessonsLearned,
        });
      }),
  }),

  // Reminder settings
  reminder: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getReminderSettings(ctx.user.id);
      return settings ?? null;
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        dailyReminderTime: z.string().optional(),
        weeklyReviewDay: z.number().optional(),
        weeklyReviewTime: z.string().optional(),
        enableDailyReminders: z.boolean().optional(),
        enableWeeklyReminders: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertReminderSettings({
          userId: ctx.user.id,
          dailyReminderTime: input.dailyReminderTime,
          weeklyReviewDay: input.weeklyReviewDay,
          weeklyReviewTime: input.weeklyReviewTime,
          enableDailyReminders: input.enableDailyReminders,
          enableWeeklyReminders: input.enableWeeklyReminders,
        });
      }),
  }),

  // Flashcard tracking
  flashcard: router({
    recordView: protectedProcedure
      .input(z.object({
        flashcardKey: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.recordFlashcardView({
          userId: ctx.user.id,
          flashcardKey: input.flashcardKey,
          context: input.context,
        });
        return { success: true };
      }),
    
    getRecentViews: protectedProcedure.query(async ({ ctx }) => {
      return db.getRecentFlashcardViews(ctx.user.id);
    }),
  }),

  // Dashboard statistics
  stats: router({
    getDashboard: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [weeklyScores, goals, userAvg, globalAvg] = await Promise.all([
          db.getWeeklyScoresByCycle(input.cycleId, ctx.user.id),
          db.getGoalsByCycle(input.cycleId, ctx.user.id),
          db.getUserAverageExecutionScore(ctx.user.id),
          db.getGlobalAverageExecutionScore(),
        ]);
        
        const currentWeekScore = weeklyScores.length > 0 
          ? parseFloat(weeklyScores[weeklyScores.length - 1].executionScore ?? "0") 
          : 0;
        
        const averageScore = weeklyScores.length > 0
          ? weeklyScores.reduce((sum, s) => sum + parseFloat(s.executionScore ?? "0"), 0) / weeklyScores.length
          : 0;
        
        const weeksOnTarget = weeklyScores.filter(s => parseFloat(s.executionScore ?? "0") >= 85).length;
        
        return {
          currentWeekScore,
          averageScore,
          weeksOnTarget,
          totalWeeks: weeklyScores.length,
          weeklyScores: weeklyScores.map(s => ({
            weekNumber: s.weekNumber,
            score: parseFloat(s.executionScore ?? "0"),
          })),
          goalCount: goals.length,
          userAverageScore: userAvg,
          globalAverageScore: globalAvg,
          targetThreshold: 85,
        };
      }),
  }),

  // PDF Export
  export: router({
    weeklyScorecard: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        weekNumber: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const cycle = await db.getCycleById(input.cycleId, ctx.user.id);
        if (!cycle) throw new Error("Cycle not found");
        
        const scorecard = await db.getWeeklyScore(input.cycleId, ctx.user.id, input.weekNumber);
        const goals = await db.getGoalsByCycle(input.cycleId, ctx.user.id);
        
        // Get tactics for all goals
        const allTactics: { title: string; weeklyTarget: number; completed: number }[] = [];
        for (const goal of goals) {
          const tactics = await db.getTacticsByGoal(goal.id, ctx.user.id);
          for (const tactic of tactics) {
            const entries = await db.getTacticEntriesByWeek(tactic.id, ctx.user.id, input.weekNumber);
            const completed = entries.filter(e => e.completed).length;
            allTactics.push({
              title: tactic.title,
              weeklyTarget: tactic.weeklyTarget ?? 7,
              completed,
            });
          }
        }
        
        const html = generateScorecardHTML({
          weekNumber: input.weekNumber,
          executionScore: scorecard?.executionScore ?? "0",
          tactics: allTactics,
        }, cycle.title);
        
        return { html };
      }),
    
    cycleReview: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        reviewType: z.enum(["mid_cycle", "final"]),
      }))
      .query(async ({ ctx, input }) => {
        const cycle = await db.getCycleById(input.cycleId, ctx.user.id);
        if (!cycle) throw new Error("Cycle not found");
        
        const review = await db.getCycleReview(input.cycleId, ctx.user.id, input.reviewType);
        const goals = await db.getGoalsByCycle(input.cycleId, ctx.user.id);
        const weeklyScores = await db.getWeeklyScoresByCycle(input.cycleId, ctx.user.id);
        
        const avgScore = weeklyScores.length > 0
          ? weeklyScores.reduce((sum: number, s: { executionScore?: string | null }) => sum + parseFloat(s.executionScore ?? "0"), 0) / weeklyScores.length
          : 0;
        
        const html = generateCycleReviewHTML({
          cycleTitle: cycle.title,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          reviewType: input.reviewType,
          averageExecutionScore: avgScore.toString(),
          greatestSuccess: review?.greatestSuccess ?? "",
          biggestObstacle: review?.biggestObstacle ?? "",
          mostEffectiveTactic: review?.mostEffectiveTactic ?? "",
          pitfallsEncountered: review?.pitfallsEncountered ?? "",
          adjustmentsForNextCycle: review?.adjustmentsForNextCycle ?? "",
          lessonsLearned: review?.lessonsLearned ?? "",
          weeklyScores: weeklyScores.map((s: { weekNumber: number; executionScore?: string | null }) => ({
            weekNumber: s.weekNumber,
            score: parseFloat(s.executionScore ?? "0"),
          })),
          goals: goals.map(g => ({
            title: g.title,
            lagIndicator: g.lagIndicator ?? "",
            lagTarget: g.lagTarget ?? "",
            lagCurrentValue: g.lagCurrentValue ?? "",
          })),
        });
        
        return { html };
      }),
  }),

  // Accountability Partners
  partner: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPartnersByUser(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        partnerEmail: z.string().email(),
        partnerName: z.string().optional(),
        shareProgress: z.boolean().optional(),
        shareGoals: z.boolean().optional(),
        wamDay: z.number().min(0).max(6).optional(),
        wamTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const inviteToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        return db.createPartner({
          userId: ctx.user.id,
          partnerEmail: input.partnerEmail,
          partnerName: input.partnerName,
          shareProgress: input.shareProgress ?? true,
          shareGoals: input.shareGoals ?? true,
          wamDay: input.wamDay ?? 0,
          wamTime: input.wamTime ?? "10:00",
          inviteToken,
          status: "pending",
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        partnerName: z.string().optional(),
        shareProgress: z.boolean().optional(),
        shareGoals: z.boolean().optional(),
        wamDay: z.number().optional(),
        wamTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePartner(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePartner(input.id, ctx.user.id);
        return { success: true };
      }),
    
    getSharedProgress: protectedProcedure
      .input(z.object({ partnerId: z.number(), cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const partner = await db.getPartnerById(input.partnerId, ctx.user.id);
        if (!partner || !partner.partnerUserId) {
          return null;
        }
        return db.getSharedProgressForPartner(partner.partnerUserId, input.cycleId);
      }),
  }),

  // WAM Records
  wam: router({
    get: protectedProcedure
      .input(z.object({ cycleId: z.number(), weekNumber: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWamRecord(input.cycleId, ctx.user.id, input.weekNumber);
      }),
    
    list: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getWamRecordsByCycle(input.cycleId, ctx.user.id);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        cycleId: z.number(),
        weekNumber: z.number(),
        partnerId: z.number().optional(),
        meetingDate: z.date().optional(),
        executionScoreShared: z.string().optional(),
        winsShared: z.string().optional(),
        challengesShared: z.string().optional(),
        commitmentsForNextWeek: z.string().optional(),
        partnerFeedback: z.string().optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertWamRecord({
          userId: ctx.user.id,
          cycleId: input.cycleId,
          weekNumber: input.weekNumber,
          partnerId: input.partnerId,
          meetingDate: input.meetingDate,
          executionScoreShared: input.executionScoreShared,
          winsShared: input.winsShared,
          challengesShared: input.challengesShared,
          commitmentsForNextWeek: input.commitmentsForNextWeek,
          partnerFeedback: input.partnerFeedback,
          completed: input.completed,
        });
      }),
  }),

  // Notification management
  notification: router({
    sendReminder: protectedProcedure
      .input(z.object({
        type: z.enum(["daily_scorecard", "weekly_review", "wam", "custom"]),
        message: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const titles: Record<string, string> = {
          daily_scorecard: "📊 Time to Update Your Scorecard",
          weekly_review: "📝 Weekly Review Reminder",
          wam: "🤝 Weekly Accountability Meeting",
          custom: "🎯 12 Week Year Reminder",
        };
        
        const messages: Record<string, string> = {
          daily_scorecard: "Don't forget to log your daily execution! Track your lead indicators to stay on target for 85%.",
          weekly_review: "Time to reflect on your week. What worked? What needs adjustment? Complete your weekly review now.",
          wam: "Schedule your Weekly Accountability Meeting to stay on track with your 12-week goals.",
          custom: input.message || "Stay focused on your 12-week goals!",
        };
        
        const success = await notifyOwner({
          title: titles[input.type],
          content: messages[input.type],
        });
        
        return { success };
      }),
    
    testNotification: protectedProcedure
      .mutation(async ({ ctx }) => {
        const success = await notifyOwner({
          title: "🎯 12 Week Year - Test Notification",
          content: "Your notifications are working! You'll receive reminders based on your settings.",
        });
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
