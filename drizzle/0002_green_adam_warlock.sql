CREATE TABLE `accountabilityPartners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`partnerEmail` varchar(320) NOT NULL,
	`partnerName` varchar(255),
	`partnerUserId` int,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`shareProgress` boolean DEFAULT true,
	`shareGoals` boolean DEFAULT true,
	`wamDay` int DEFAULT 0,
	`wamTime` varchar(10),
	`inviteToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountabilityPartners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wamRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`partnerId` int,
	`cycleId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`meetingDate` timestamp,
	`executionScoreShared` decimal(5,2),
	`winsShared` text,
	`challengesShared` text,
	`commitmentsForNextWeek` text,
	`partnerFeedback` text,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wamRecords_id` PRIMARY KEY(`id`)
);
