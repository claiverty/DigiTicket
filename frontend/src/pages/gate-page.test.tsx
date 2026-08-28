import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import {
  getGateEvents,
  getGateValidations,
  validateGateTicket,
} from '../services/gate-service';
import type {
  GateEvent,
  GateValidationResponse,
} from '../types/gate';
import { GatePage } from './gate-page';

vi.mock('../hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/gate-service', () => ({
  getGateEvents: vi.fn(),
  getGateValidations: vi.fn(),
  validateGateTicket: vi.fn(),
}));

vi.mock('../components/qr-scanner', () => ({
  QrScanner: () => <div>Câmera simulada no teste</div>,
}));

const gateEvent: GateEvent = {
  id: 'event-1',
  title: 'Show de Teste',
  venueName: 'Arena Teste',
  city: 'Brasília',
  state: 'DF',
  startDate: '2026-12-10T22:00:00.000Z',
  endDate: '2026-12-11T02:00:00.000Z',
  _count: { tickets: 120 },
};

function createValidationResponse(
  result: GateValidationResponse['result'],
): GateValidationResponse {
  return {
    result,
    message:
      result === 'VALID'
        ? 'Ingresso validado com sucesso.'
        : 'Este ingresso já foi utilizado.',
    validatedAt: '2026-12-10T21:00:00.000Z',
    ticket: {
      id: 'ticket-1',
      manualCode: 'DT-TESTE-1234',
      status: 'USED',
      usedAt: '2026-12-10T21:00:00.000Z',
      customer: { name: 'Cliente Teste' },
      ticketType: { name: 'Pista' },
      event: { id: gateEvent.id, title: gateEvent.title },
    },
  };
}

function renderGatePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <GatePage />
    </QueryClientProvider>,
  );
}

describe('GatePage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: 'token-portaria',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getGateEvents).mockResolvedValue([gateEvent]);
    vi.mocked(getGateValidations).mockResolvedValue([]);
  });

  it('seleciona o evento disponível e mostra o estado vazio do histórico', async () => {
    renderGatePage();

    expect(
      await screen.findByRole('option', {
        name: 'Show de Teste — 120 ingressos',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Arena Teste · Brasília/DF')).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma tentativa registrada')).toBeInTheDocument();
  });

  it('normaliza o código manual e apresenta um ingresso válido', async () => {
    vi.mocked(validateGateTicket).mockResolvedValue(
      createValidationResponse('VALID'),
    );
    const user = userEvent.setup();
    renderGatePage();

    const input = await screen.findByPlaceholderText('DT-XXXX-XXXX-XXXX');
    await user.type(input, 'dt-teste-1234');
    await user.click(
      screen.getByRole('button', { name: 'Validar ingresso' }),
    );

    await waitFor(() => {
      expect(validateGateTicket).toHaveBeenCalledWith(
        'event-1',
        'DT-TESTE-1234',
        'token-portaria',
      );
    });
    expect(await screen.findByText('VÁLIDO')).toBeInTheDocument();
    expect(screen.getByText('Titular: Cliente Teste')).toBeInTheDocument();
  });

  it('diferencia um ingresso que já foi utilizado', async () => {
    vi.mocked(validateGateTicket).mockResolvedValue(
      createValidationResponse('ALREADY_USED'),
    );
    const user = userEvent.setup();
    renderGatePage();

    await user.type(
      await screen.findByPlaceholderText('DT-XXXX-XXXX-XXXX'),
      'DT-TESTE-1234',
    );
    await user.click(
      screen.getByRole('button', { name: 'Validar ingresso' }),
    );

    expect(await screen.findByText('JÁ UTILIZADO')).toBeInTheDocument();
    expect(
      screen.getByText('Este ingresso já foi utilizado.'),
    ).toBeInTheDocument();
  });

  it('mostra a falha da API durante uma validação', async () => {
    vi.mocked(validateGateTicket).mockRejectedValue(
      new Error('Não foi possível validar o ingresso.'),
    );
    const user = userEvent.setup();
    renderGatePage();

    await user.type(
      await screen.findByPlaceholderText('DT-XXXX-XXXX-XXXX'),
      'DT-ERRO-1234',
    );
    await user.click(
      screen.getByRole('button', { name: 'Validar ingresso' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível validar o ingresso.',
    );
  });

  it('mostra uma orientação quando não existem eventos publicados', async () => {
    vi.mocked(getGateEvents).mockResolvedValue([]);
    renderGatePage();

    expect(
      await screen.findByText('Nenhum evento publicado está disponível'),
    ).toBeInTheDocument();
  });
});
