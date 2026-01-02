CREATE TABLE `checklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`itemKey` varchar(100) NOT NULL,
	`itemLabel` varchar(500) NOT NULL,
	`isCompleted` boolean DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycleReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`reviewType` enum('mid_cycle','final') NOT NULL,
	`averageExecutionScore` decimal(5,2),
	`lagIndicatorProgress` json,
	`greatestSuccess` text,
	`biggestObstacle` text,
	`mostEffectiveTactic` text,
	`pitfallsEncountered` text,
	`adjustmentsForNextCycle` text,
	`lessonsLearned` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycleReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('planning','active','completed','archived') NOT NULL DEFAULT 'planning',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flashcardViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flashcardKey` varchar(100) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`context` varchar(100),
	CONSTRAINT `flashcardViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`lagIndicator` text,
	`lagTarget` varchar(255),
	`lagCurrentValue` varchar(255),
	`whyItMatters` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`blockType` enum('strategic','buffer','breakout') NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`description` text,
	`isRecurring` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyReminderTime` varchar(10),
	`weeklyReviewDay` int DEFAULT 0,
	`weeklyReviewTime` varchar(10),
	`enableDailyReminders` boolean DEFAULT true,
	`enableWeeklyReminders` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminderSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tacticEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tacticId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`date` timestamp NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tacticEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tactics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`weeklyTarget` int NOT NULL,
	`totalTarget` int NOT NULL,
	`measurementUnit` varchar(100),
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tactics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`longTermVision` text,
	`strategicImperatives` json,
	`commitmentStatement` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`whatWorkedWell` text,
	`whatDidNotWork` text,
	`adjustmentsForNextWeek` text,
	`wamCompleted` boolean DEFAULT false,
	`wamNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`executionScore` decimal(5,2),
	`strategicBlocksPlanned` int DEFAULT 0,
	`strategicBlocksCompleted` int DEFAULT 0,
	`bufferBlocksPlanned` int DEFAULT 0,
	`bufferBlocksCompleted` int DEFAULT 0,
	`breakoutBlocksPlanned` int DEFAULT 0,
	`breakoutBlocksCompleted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyScores_id` PRIMARY KEY(`id`)
);
