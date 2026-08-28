-- Expira reservas pendentes em lotes e devolve estoque e assentos na mesma
-- transação. O bloqueio evita que o job concorra com pagamento ou cancelamento.
CREATE OR REPLACE FUNCTION public.expire_pending_reservations(batch_size INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  reservation_ids UUID[];
  expired_count INTEGER;
BEGIN
  SELECT COALESCE(array_agg(candidate.id), ARRAY[]::UUID[])
  INTO reservation_ids
  FROM (
    SELECT reservation.id
    FROM public.reservations AS reservation
    WHERE reservation.status = 'PENDING_PAYMENT'
      AND reservation.expires_at <= CURRENT_TIMESTAMP
    ORDER BY reservation.expires_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(batch_size, 100), 1), 1000)
  ) AS candidate;

  IF cardinality(reservation_ids) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.reservations
  SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
  WHERE id = ANY(reservation_ids)
    AND status = 'PENDING_PAYMENT'
    AND expires_at <= CURRENT_TIMESTAMP;

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  UPDATE public.ticket_types AS ticket_type
  SET available_quantity = ticket_type.available_quantity + restored.quantity,
      updated_at = CURRENT_TIMESTAMP
  FROM (
    SELECT item.ticket_type_id, SUM(item.quantity)::INTEGER AS quantity
    FROM public.reservation_items AS item
    WHERE item.reservation_id = ANY(reservation_ids)
    GROUP BY item.ticket_type_id
  ) AS restored
  WHERE ticket_type.id = restored.ticket_type_id;

  UPDATE public.event_seats
  SET status = 'AVAILABLE',
      reservation_id = NULL,
      updated_at = CURRENT_TIMESTAMP
  WHERE reservation_id = ANY(reservation_ids)
    AND status = 'HELD';

  RETURN expired_count;
END;
$$;

-- A função é operacional e não pode ser chamada pelos papéis da Data API.
REVOKE ALL ON FUNCTION public.expire_pending_reservations(INTEGER)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_pending_reservations(INTEGER)
  TO postgres;

COMMENT ON FUNCTION public.expire_pending_reservations(INTEGER) IS
  'Expira reservas pendentes vencidas e libera estoque e assentos de forma idempotente.';
