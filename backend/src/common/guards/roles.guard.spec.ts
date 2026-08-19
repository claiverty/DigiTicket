import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('nega acesso quando o papel autenticado não é permitido', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ORGANIZER]),
    } as unknown as Reflector;
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.CUSTOMER } }),
      }),
    } as unknown as ExecutionContext;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });
});
