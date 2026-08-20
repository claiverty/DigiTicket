import { apiRequest } from './api';
import type { PaymentResult, PaymentStatus } from '../types/reservation';

export function simulatePayment(
  reservationId: string,
  outcome: PaymentStatus,
  token: string,
) {
  return apiRequest<PaymentResult>(
    `/api/payments/reservations/${reservationId}/simulate`,
    {
      method: 'POST',
      body: JSON.stringify({ outcome }),
      token,
    },
  );
}
