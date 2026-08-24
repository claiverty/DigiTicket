-- O DigiTicket acessa o banco somente pela API NestJS. Nenhum papel da Data API
-- pode consultar ou alterar tabelas diretamente.
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ticket_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reservation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."event_seats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ticket_validation_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ticket_transfers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_direct_access" ON public."_prisma_migrations"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."users"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."events"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."ticket_types"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."reservations"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."reservation_items"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."payments"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."tickets"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."event_seats"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."ticket_validation_logs"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY "deny_direct_access" ON public."ticket_transfers"
  AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;

-- Novos objetos também começam privados até uma migration conceder acesso.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
  FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES
  FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM PUBLIC, anon, authenticated, service_role;
