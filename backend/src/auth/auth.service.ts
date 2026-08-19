import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { PublicUser } from '../users/users.types';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './auth.types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.usersService.findCredentialsByEmail(email);

    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    try {
      const user = await this.usersService.create({
        name: input.name.trim(),
        email,
        passwordHash,
        // O cadastro público nunca aceita um papel enviado pelo cliente.
        role: Role.CUSTOMER,
      });

      return this.createSession(user);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma conta com este e-mail.');
      }

      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersService.findCredentialsByEmail(email);
    const validPassword = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

    if (!user || !validPassword) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return this.createSession(publicUser);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findPublicById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário autenticado não encontrado.');
    }

    return user;
  }

  private async createSession(user: PublicUser): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
