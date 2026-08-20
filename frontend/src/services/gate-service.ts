import { apiRequest } from './api';
import type {
  GateEvent,
  GateValidationLog,
  GateValidationResponse,
} from '../types/gate';

export function getGateEvents(token: string) {
  return apiRequest<GateEvent[]>('/api/gate/events', { token });
}

export function getGateValidations(eventId: string, token: string) {
  return apiRequest<GateValidationLog[]>(
    `/api/gate/events/${eventId}/validations`,
    { token },
  );
}

export function validateGateTicket(
  eventId: string,
  code: string,
  token: string,
) {
  return apiRequest<GateValidationResponse>(
    `/api/gate/events/${eventId}/validate`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({ code }),
    },
  );
}
