import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import { createReservation } from '../services/reservation-service';
import type { Event } from '../types/event';
import type { User } from '../types/auth';
import { TicketSelection } from './ticket-selection';

vi.mock('../hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/reservation-service', () => ({
  createReservation: vi.fn(),
}));

const customer: User = {
  id: 'customer-1',
  name: 'Cliente Teste',
  email: 'cliente@teste.com',
  role: 'CUSTOMER',
  createdAt: '2026-08-28T12:00:00.000Z',
  updatedAt: '2026-08-28T12:00:00.000Z',
};

const event: Event = {
  id: 'event-1',
  organizerId: 'organizer-1',
  title: 'Show de Teste',
  slug: 'show-de-teste',
  description: 'Evento criado para os testes do frontend.',
  category: 'SHOW',
  saleMode: 'GENERAL_ADMISSION',
  venueName: 'Arena Teste',
  address: 'Rua dos Testes, 100',
  city: 'Brasília',
  state: 'DF',
  startDate: '2026-12-10T22:00:00.000Z',
  endDate: '2026-12-11T02:00:00.000Z',
  posterUrl: null,
  status: 'PUBLISHED',
  externalSource: null,
  externalId: null,
  createdAt: '2026-08-28T12:00:00.000Z',
  updatedAt: '2026-08-28T12:00:00.000Z',
  ticketTypes: [
    {
      id: 'ticket-pista',
      eventId: 'event-1',
      name: 'Pista',
      description: null,
      priceCents: 5000,
      capacity: 100,
      availableQuantity: 2,
      createdAt: '2026-08-28T12:00:00.000Z',
      updatedAt: '2026-08-28T12:00:00.000Z',
    },
  ],
};

function renderTicketSelection() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/eventos/show-de-teste']}>
        <Routes>
          <Route
            path="/eventos/:slug"
            element={<TicketSelection event={event} />}
          />
          <Route
            path="/minhas-reservas"
            element={<p>Minhas reservas</p>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TicketSelection', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: customer,
      token: 'token-cliente',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('calcula o total e impede selecionar mais ingressos que o disponível', async () => {
    const user = userEvent.setup();
    renderTicketSelection();

    const addButton = screen.getByRole('button', { name: 'Adicionar Pista' });
    const reserveButton = screen.getByRole('button', {
      name: 'Reservar por 10 minutos',
    });

    expect(reserveButton).toBeDisabled();
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByText('2 ingresso(s)')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
    expect(addButton).toBeDisabled();
    expect(reserveButton).toBeEnabled();
  });

  it('envia os itens selecionados e abre as reservas após o sucesso', async () => {
    vi.mocked(createReservation).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderTicketSelection();

    await user.click(
      screen.getByRole('button', { name: 'Adicionar Pista' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Reservar por 10 minutos' }),
    );

    await waitFor(() => {
      expect(createReservation).toHaveBeenCalledWith(
        'event-1',
        { items: [{ ticketTypeId: 'ticket-pista', quantity: 1 }] },
        'token-cliente',
      );
    });
    expect(await screen.findByText('Minhas reservas')).toBeInTheDocument();
  });

  it('direciona visitantes ao login em vez de permitir a reserva', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderTicketSelection();

    const loginLink = screen.getByRole('link', { name: 'Entre para reservar' });
    expect(loginLink).toHaveAttribute('href', '/entrar');
    expect(
      screen.queryByRole('button', { name: 'Reservar por 10 minutos' }),
    ).not.toBeInTheDocument();
  });
});
