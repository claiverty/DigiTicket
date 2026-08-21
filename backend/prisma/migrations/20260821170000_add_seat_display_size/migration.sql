CREATE TYPE "SeatDisplaySize" AS ENUM ('STANDARD', 'LARGE');

ALTER TABLE "ticket_types"
ADD COLUMN "seat_display_size" "SeatDisplaySize" NOT NULL DEFAULT 'STANDARD';
