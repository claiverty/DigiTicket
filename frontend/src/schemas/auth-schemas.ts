import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve possuir pelo menos 8 caracteres.'),
});

export const registerSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome.')
    .max(100, 'O nome deve possuir no máximo 100 caracteres.'),
  password: z
    .string()
    .min(8, 'A senha deve possuir pelo menos 8 caracteres.')
    .max(72, 'A senha deve possuir no máximo 72 caracteres.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      'Use maiúscula, minúscula, número e caractere especial.',
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
