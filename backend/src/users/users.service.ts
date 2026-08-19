import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, publicUserSelect } from './users.types';

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findCredentialsByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  create(input: CreateUserInput): Promise<PublicUser> {
    return this.prisma.user.create({
      data: input,
      select: publicUserSelect,
    });
  }
}
