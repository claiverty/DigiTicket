-- CreateEnum
CREATE TYPE "TicketTransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'DECLINED');

-- CreateTable
CREATE TABLE "ticket_transfers" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "status" "TicketTransferStatus" NOT NULL DEFAULT 'PENDING',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_transfers_sender_id_created_at_idx" ON "ticket_transfers"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_transfers_recipient_id_status_created_at_idx" ON "ticket_transfers"("recipient_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ticket_transfers_ticket_id_created_at_idx" ON "ticket_transfers"("ticket_id", "created_at");

-- Impede duas solicitações pendentes para o mesmo ingresso.
CREATE UNIQUE INDEX "ticket_transfers_one_pending_per_ticket_idx"
ON "ticket_transfers"("ticket_id")
WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- O navegador não acessa esta tabela diretamente; a API usa a conexão do backend.
ALTER TABLE "ticket_transfers" ENABLE ROW LEVEL SECURITY;
