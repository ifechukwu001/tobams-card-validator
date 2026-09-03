CREATE TABLE `cards` (
	`card_number` text PRIMARY KEY NOT NULL,
	`cardholder_name` text NOT NULL,
	`expiry_date` text NOT NULL,
	`cvv` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
