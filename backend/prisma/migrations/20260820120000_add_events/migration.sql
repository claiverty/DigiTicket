CREATE TYPE "EventCategory" AS ENUM ('SHOW', 'MOVIE', 'THEATER', 'OTHER');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "EventSaleMode" AS ENUM ('GENERAL_ADMISSION', 'RESERVED_SEATING');

CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "sale_mode" "EventSaleMode" NOT NULL,
    "venue_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "poster_url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "external_source" TEXT,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE UNIQUE INDEX "events_external_source_external_id_key" ON "events"("external_source", "external_id");
CREATE INDEX "events_organizer_id_status_idx" ON "events"("organizer_id", "status");
CREATE INDEX "events_status_start_date_idx" ON "events"("status", "start_date");
CREATE INDEX "events_category_city_idx" ON "events"("category", "city");

ALTER TABLE "events"
ADD CONSTRAINT "events_organizer_id_fkey"
FOREIGN KEY ("organizer_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
