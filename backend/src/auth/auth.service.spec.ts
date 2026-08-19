import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { PublicUser } from '../users/users.types';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const now = new Date('2026-08-19T12:00:00.000Z');
  const publicUser: PublicUser = {
    id: '5d8d8556-e4a9-43b7-a6ac-e8b53e736c11',
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    role: Role.CUSTOMER,
    createdAt: now,
    updatedAt: now,
  };

  const usersMock = {
    findCredentialsByEmail: jest.fn(),
    findPublicById: jest.fn(),
    create: jest.fn(),
  };
  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('jwt-assinado'),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersMock as unknown as UsersService,
      jwtMock as unknown as JwtService,
    );
  });

  it('autentica credenciais válidas e emite um JWT', async () => {
    const passwordHash = await bcrypt.hash('Demo123!', 4);
    usersMock.findCredentialsByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash,
    });

    const result = await service.login({
      email: 'CLIENTE@DEMO.COM',
      password: 'Demo123!',
    });

    expect(result.accessToken).toBe('jwt-assinado');
    expect(result.user).toEqual(publicUser);
    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: publicUser.id,
      email: publicUser.email,
      role: Role.CUSTOMER,
    });
  });

  it('rejeita senha incorreta sem revelar qual credencial falhou', async () => {
    const passwordHash = await bcrypt.hash('Demo123!', 4);
    usersMock.findCredentialsByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash,
    });

    await expect(
      service.login({ email: publicUser.email, password: 'Errada123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sempre cria cadastro público com papel de cliente', async () => {
    usersMock.findCredentialsByEmail.mockResolvedValue(null);
    usersMock.create.mockResolvedValue(publicUser);

    await service.register({
      name: ' Cliente Demo ',
      email: 'CLIENTE@DEMO.COM',
      password: 'Demo123!',
    });

    expect(usersMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Cliente Demo',
        email: 'cliente@demo.com',
        role: Role.CUSTOMER,
      }),
    );
  });

  it('rejeita cadastro com e-mail já utilizado', async () => {
    usersMock.findCredentialsByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash: 'hash',
    });

    await expect(
      service.register({
        name: 'Cliente Demo',
        email: publicUser.email,
        password: 'Demo123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
