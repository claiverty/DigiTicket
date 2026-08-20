import { z } from 'zod';

export const ticketTypeSchema = z.object({
  name: z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  description: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
  priceReais: z
    .number({ error: 'Informe um preço válido.' })
    .min(0, 'O preço não pode ser negativo.'),
  capacity: z
    .number({ error: 'Informe uma capacidade válida.' })
    .int('A capacidade deve ser um número inteiro.')
    .min(1, 'A capacidade deve ser de pelo menos 1 ingresso.'),
});

export type TicketTypeFormData = z.infer<typeof ticketTypeSchema>;
