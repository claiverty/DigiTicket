import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

interface FindUniqueArgs {
  where: { id?: string; email?: string };
  select?: Record<string, boolean>;
}

interface CreateArgs {
  data: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>;
}

function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

describe('Aplicação (e2e)', () => {
  let app: INestApplication<App>;
  let users: Map<string, StoredUser>;

  beforeEach(async () => {
    users = new Map<string, StoredUser>();

    const prismaMock = {
      user: {
        findUnique: jest.fn(({ where, select }: FindUniqueArgs) => {
          const user = where.email
            ? users.get(where.email)
            : [...users.values()].find((item) => item.id === where.id);

          if (!user || !select) {
            return user ?? null;
          }

          return toPublicUser(user);
        }),
        create: jest.fn(({ data }: CreateArgs) => {
          const now = new Date();
          const user: StoredUser = {
            ...data,
            id: randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          users.set(user.email, user);
          return toPublicUser(user);
        }),
      },
      event: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      reservation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      ticket: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('expõe o health check publicamente', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        const payload = body as { status: string; service: string };

        expect(payload.status).toBe('ok');
        expect(payload.service).toBe('digiticket-api');
      });
  });

  it('cadastra cliente, autentica e protege /auth/me com JWT', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Maria Silva',
        email: 'maria@email.com',
        password: 'Senha123!',
      })
      .expect(201);
    const registration = registerResponse.body as {
      accessToken: string;
      user: { email: string; role: Role };
    };

    expect(registration.user.role).toBe(Role.CUSTOMER);

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registration.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const user = body as { email: string; role: Role };
        expect(user.email).toBe('maria@email.com');
        expect(user.role).toBe(Role.CUSTOMER);
      });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'maria@email.com', password: 'Senha123!' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'maria@email.com', password: 'Incorreta123!' })
      .expect(401);
  });

  it('rejeita tentativa de escolher papel no cadastro público', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Organizador Indevido',
        email: 'indevido@email.com',
        password: 'Senha123!',
        role: Role.ORGANIZER,
      })
      .expect(400);
  });

  it('expõe o catálogo e protege a gestão de eventos por papel', async () => {
    await request(app.getHttpServer()).get('/api/events').expect(200, []);

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Cliente sem permissão',
        email: 'cliente-eventos@email.com',
        password: 'Senha123!',
      })
      .expect(201);
    const registration = registerResponse.body as { accessToken: string };

    await request(app.getHttpServer())
      .get('/api/organizer/events')
      .set('Authorization', `Bearer ${registration.accessToken}`)
      .expect(403);
  });

  it('protege ingressos próprios e permite consultar um link público', async () => {
    await request(app.getHttpServer()).get('/api/tickets').expect(401);
    await request(app.getHttpServer())
      .get('/api/tickets/shared/token-inexistente')
      .expect(404);
  });

  it('protege a portaria por autenticação e papel GATE', async () => {
    await request(app.getHttpServer()).get('/api/gate/events').expect(401);

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Cliente sem acesso à portaria',
        email: 'cliente-portaria@email.com',
        password: 'Senha123!',
      })
      .expect(201);
    const registration = registerResponse.body as { accessToken: string };

    await request(app.getHttpServer())
      .get('/api/gate/events')
      .set('Authorization', `Bearer ${registration.accessToken}`)
      .expect(403);
  });

  afterEach(async () => {
    await app.close();
  });
});
