CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"price" numeric NOT NULL,
	"rating" numeric NOT NULL,
	"stock" integer NOT NULL,
	"brand" varchar,
	"sku" varchar NOT NULL
);
