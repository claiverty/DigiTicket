import { z } from 'zod';

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, 'Informe um título com pelo menos 3 caracteres.'),
    description: z
      .string()
      .trim()
      .min(20, 'A descrição deve ter pelo menos 20 caracteres.')
      .max(5_000, 'A descrição deve ter no máximo 5.000 caracteres.'),
    category: z.enum(['SHOW', 'MOVIE', 'THEATER', 'OTHER']),
    saleMode: z.enum(['GENERAL_ADMISSION', 'RESERVED_SEATING']),
    venueName: z.string().trim().min(2, 'Informe o nome do local.'),
    address: z.string().trim().min(5, 'Informe o endereço do evento.'),
    city: z.string().trim().min(2, 'Informe a cidade.'),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, 'Use a sigla do estado com 2 letras.'),
    startDate: z.string().min(1, 'Informe a data de início.'),
    endDate: z.string().min(1, 'Informe a data de término.'),
    posterUrl: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || URL.canParse(value),
        'Informe uma URL válida para o cartaz.',
      ),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'O término deve acontecer depois do início.',
    path: ['endDate'],
  });

export type EventFormData = z.infer<typeof eventSchema>;
