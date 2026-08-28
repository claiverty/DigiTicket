import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import { ApiError } from '../services/api';
import { simulatePayment } from '../services/payment-service';
import { getReservation } from '../services/reservation-service';
import type { PaymentResult, Reservation } from '../types/reservation';
import { CheckoutPage } from './checkout-page';

vi.mock('../hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/payment-service', () => ({
  simulatePayment: vi.fn(),
}));

vi.mock('../services/reservation-service', () => ({
  getReservation: vi.fn(),
}));

function createReservation(
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: 'reservation-1',
    customerId: 'customer-1',
    eventId: 'event-1',
    status: 'PENDING_PAYMENT',
    totalCents: 10000,
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
    event: {
      id: 'event-1',
      slug: 'show-de-teste',
      title: 'Show de Teste',
      posterUrl: null,
      venueName: 'Arena Teste',
      city: 'Brasília',
      state: 'DF',
      startDate: '2026-12-10T22:00:00.000Z',
    },
    items: [
      {
        id: 'item-1',
        reservationId: 'reservation-1',
        ticketTypeId: 'ticket-pista',
        quantity: 2,
        unitPriceCents: 5000,
        createdAt: '2026-08-28T12:00:00.000Z',
        ticketType: { id: 'ticket-pista', name: 'Pista' },
      },
    ],
    heldSeats: [],
    payment: null,
    _count: { tickets: 0 },
    ...overrides,
  };
}

function createPaymentResult(
  status: 'APPROVED' | 'DECLINED',
): PaymentResult {
  const reservation = createReservation({
    status: status === 'APPROVED' ? 'PAID' : 'DECLINED',
  });

  return {
    payment: {
      id: 'payment-1',
      reservationId: reservation.id,
      status,
      amountCents: reservation.totalCents,
      processedAt: '2026-08-28T12:05:00.000Z',
      createdAt: '2026-08-28T12:05:00.000Z',
    },
    reservation,
    ticketsCreated: status === 'APPROVED' ? 2 : 0,
  };
}

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/checkout/reservation-1']}>
        <Routes>
          <Route path="/checkout/:id" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: 'token-cliente',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getReservation).mockResolvedValue(createReservation());
  });

  it('apresenta o pedido, o tempo da reserva e o aviso de simulação', async () => {
    renderCheckout();

    expect(await screen.findByText('Show de Teste')).toBeInTheDocument();
    expect(screen.getByText('2× Pista')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 100,00')).toHaveLength(2);
    expect(screen.getByText(/Nenhuma cobrança real/)).toBeInTheDocument();
    expect(screen.getByText(/Reserva:/)).toBeInTheDocument();
  });

  it('simula a aprovação e informa os ingressos gerados', async () => {
    vi.mocked(simulatePayment).mockResolvedValue(
      createPaymentResult('APPROVED'),
    );
    const user = userEvent.setup();
    renderCheckout();

    await user.click(
      await screen.findByRole('button', { name: 'Simular aprovação' }),
    );

    await waitFor(() => {
      expect(simulatePayment).toHaveBeenCalledWith(
        'reservation-1',
        'APPROVED',
        'token-cliente',
      );
    });
    expect(await screen.findByText('Pagamento aprovado')).toBeInTheDocument();
    expect(screen.getByText(/2 ingresso\(s\) foram gerados/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir meus ingressos' }),
    ).toHaveAttribute('href', '/meus-ingressos');
  });

  it('mostra a mensagem da API quando o pagamento falha', async () => {
    vi.mocked(simulatePayment).mockRejectedValue(
      new ApiError('A reserva expirou.', 409),
    );
    const user = userEvent.setup();
    renderCheckout();

    await user.click(
      await screen.findByRole('button', { name: 'Simular aprovação' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A reserva expirou.',
    );
  });

  it('bloqueia o pagamento quando a reserva já expirou', async () => {
    vi.mocked(getReservation).mockResolvedValue(
      createReservation({ expiresAt: '2020-01-01T00:00:00.000Z' }),
    );
    renderCheckout();

    expect(await screen.findByText('Esta reserva já expirou.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Simular aprovação' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Simular recusa' }),
    ).toBeDisabled();
  });
});
