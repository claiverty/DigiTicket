import { apiRequest } from './api';
import type { TicketTransfer } from '../types/ticket-transfer';

export function createTicketTransfer(
  ticketId: string,
  recipientEmail: string,
  token: string,
) {
  return apiRequest<TicketTransfer>(`/api/tickets/${ticketId}/transfers`, {
    method: 'POST',
    token,
    body: JSON.stringify({ recipientEmail }),
  });
}

export function getIncomingTicketTransfers(token: string) {
  return apiRequest<TicketTransfer[]>('/api/ticket-transfers/incoming', {
    token,
  });
}

export function getOutgoingTicketTransfers(token: string) {
  return apiRequest<TicketTransfer[]>('/api/ticket-transfers/outgoing', {
    token,
  });
}

export function acceptTicketTransfer(id: string, token: string) {
  return resolveTicketTransfer(id, 'accept', token);
}

export function declineTicketTransfer(id: string, token: string) {
  return resolveTicketTransfer(id, 'decline', token);
}

export function cancelTicketTransfer(id: string, token: string) {
  return resolveTicketTransfer(id, 'cancel', token);
}

function resolveTicketTransfer(
  id: string,
  action: 'accept' | 'decline' | 'cancel',
  token: string,
) {
  return apiRequest<TicketTransfer>(
    `/api/ticket-transfers/${id}/${action}`,
    { method: 'POST', token },
  );
}
