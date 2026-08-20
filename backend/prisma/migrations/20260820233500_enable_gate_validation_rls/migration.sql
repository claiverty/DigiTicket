-- A API usa a conexão do backend; nenhuma política libera acesso direto pela Data API.
ALTER TABLE "ticket_validation_logs" ENABLE ROW LEVEL SECURITY;
