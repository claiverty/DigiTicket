CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'HELD', 'SOLD');

CREATE TABLE "event_seats" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "reservation_id" UUID,
    "row_label" TEXT NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_seats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_seats_number_check" CHECK ("seat_number" > 0),
    CONSTRAINT "event_seats_hold_check" CHECK (
      ("status" = 'HELD' AND "reservation_id" IS NOT NULL)
      OR ("status" <> 'HELD')
    )
);

ALTER TABLE "tickets" ADD COLUMN "seat_id" UUID;

CREATE UNIQUE INDEX "event_seats_event_id_row_label_seat_number_key" ON "event_seats"("event_id", "row_label", "seat_number");
CREATE INDEX "event_seats_event_id_status_idx" ON "event_seats"("event_id", "status");
CREATE INDEX "event_seats_ticket_type_id_idx" ON "event_seats"("ticket_type_id");
CREATE INDEX "event_seats_reservation_id_idx" ON "event_seats"("reservation_id");
CREATE UNIQUE INDEX "tickets_seat_id_key" ON "tickets"("seat_id");

ALTER TABLE "event_seats" ADD CONSTRAINT "event_seats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_seats" ADD CONSTRAINT "event_seats_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_seats" ADD CONSTRAINT "event_seats_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "event_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A API usa a conexão do backend; nenhuma política libera acesso direto pela Data API.
ALTER TABLE "event_seats" ENABLE ROW LEVEL SECURITY;
