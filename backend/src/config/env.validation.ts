type Environment = Record<string, unknown>;

function parsePort(value: unknown): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser uma porta TCP válida.');
  }

  return port;
}

export function validateEnvironment(config: Environment): Environment {
  const jwtSecret =
    typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET deve possuir pelo menos 32 caracteres.');
  }

  return {
    ...config,
    PORT: parsePort(config.PORT),
    FRONTEND_URL: config.FRONTEND_URL ?? 'http://localhost:5173',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '7d',
  };
}
