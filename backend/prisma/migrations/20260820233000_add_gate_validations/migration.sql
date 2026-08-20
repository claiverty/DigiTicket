-- CreateEnum
CREATE TYPE "TicketValidationResult" AS ENUM ('VALID', 'INVALID', 'WRONG_EVENT', 'ALREADY_USED');

-- CreateEnum
CREATE TYPE "TicketValidationMethod" AS ENUM ('QR', 'MANUAL');

-- CreateTable
CREATE TABLE "ticket_validation_logs" (
    "id" UUID NOT NULL,
    "ticket_id" UUID,
    "event_id" UUID NOT NULL,
    "gate_user_id" UUID NOT NULL,
    "result" "TicketValidationResult" NOT NULL,
    "method" "TicketValidationMethod" NOT NULL,
    "presented_code_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_validation_logs_event_id_created_at_idx" ON "ticket_validation_logs"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_validation_logs_ticket_id_created_at_idx" ON "ticket_validation_logs"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_validation_logs_gate_user_id_created_at_idx" ON "ticket_validation_logs"("gate_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ticket_validation_logs" ADD CONSTRAINT "ticket_validation_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validation_logs" ADD CONSTRAINT "ticket_validation_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validation_logs" ADD CONSTRAINT "ticket_validation_logs_gate_user_id_fkey" FOREIGN KEY ("gate_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
