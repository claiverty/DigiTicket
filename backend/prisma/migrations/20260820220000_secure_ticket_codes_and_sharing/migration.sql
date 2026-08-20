ALTER TABLE "tickets"
ADD COLUMN "ticket_code" TEXT,
ADD COLUMN "manual_code" TEXT,
ADD COLUMN "share_token" TEXT,
ADD COLUMN "shared_at" TIMESTAMP(3);

UPDATE "tickets"
SET
  "ticket_code" = REPLACE(gen_random_uuid()::text, '-', '') || REPLACE(gen_random_uuid()::text, '-', ''),
  "manual_code" = 'DT-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4));

ALTER TABLE "tickets"
ALTER COLUMN "ticket_code" SET NOT NULL,
ALTER COLUMN "manual_code" SET NOT NULL;

CREATE UNIQUE INDEX "tickets_ticket_code_key" ON "tickets"("ticket_code");
CREATE UNIQUE INDEX "tickets_manual_code_key" ON "tickets"("manual_code");
CREATE UNIQUE INDEX "tickets_share_token_key" ON "tickets"("share_token");
