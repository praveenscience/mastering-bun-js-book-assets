CREATE TABLE `events` (
	`id` integer PRIMARY KEY NOT NULL,
	`ts` integer NOT NULL,
	`type` text NOT NULL,
	`user_id` text NOT NULL,
	`ms` integer NOT NULL
);
