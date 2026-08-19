import type { ConfigFactory } from '@nestjs/config';

type Environment = Record<string, unknown>;

function parsePort(value: unknown): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  return port;
}

export const validateEnvironment: ConfigFactory = (): Environment => ({
  PORT: parsePort(process.env.PORT),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  TICKET_SIGNING_SECRET: process.env.TICKET_SIGNING_SECRET,
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY,
});
