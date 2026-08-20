CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED', 'DECLINED');
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED');

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_amount_check" CHECK ("amount_cents" >= 0)
);

CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "reservation_item_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_reservation_id_key" ON "payments"("reservation_id");
CREATE INDEX "payments_status_processed_at_idx" ON "payments"("status", "processed_at");
CREATE INDEX "tickets_customer_id_created_at_idx" ON "tickets"("customer_id", "created_at");
CREATE INDEX "tickets_event_id_status_idx" ON "tickets"("event_id", "status");
CREATE INDEX "tickets_reservation_id_idx" ON "tickets"("reservation_id");

ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservation_item_id_fkey" FOREIGN KEY ("reservation_item_id") REFERENCES "reservation_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
