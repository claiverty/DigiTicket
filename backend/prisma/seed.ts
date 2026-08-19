import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo123!';
const BCRYPT_ROUNDS = 12;

const demoUsers = [
  {
    name: 'Organizador Demo',
    email: 'organizador@demo.com',
    role: Role.ORGANIZER,
  },
  {
    name: 'Cliente Demo 1',
    email: 'cliente1@demo.com',
    role: Role.CUSTOMER,
  },
  {
    name: 'Cliente Demo 2',
    email: 'cliente2@demo.com',
    role: Role.CUSTOMER,
  },
  {
    name: 'Portaria Demo',
    email: 'portaria@demo.com',
    role: Role.GATE,
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Falha ao criar os dados de demonstração.', error);
    await prisma.$disconnect();
    process.exit(1);
  });
