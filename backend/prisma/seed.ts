import {
  EventCategory,
  EventSaleMode,
  EventStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
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
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    throw new Error(
      'Seed de demonstração bloqueado. Configure DEMO_SEED_ENABLED=true somente em um ambiente isolado de avaliação.',
    );
  }

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

  const organizer = await prisma.user.findUniqueOrThrow({
    where: { email: 'organizador@demo.com' },
  });
  const publishedStartDate = new Date();
  publishedStartDate.setUTCDate(publishedStartDate.getUTCDate() + 30);
  publishedStartDate.setUTCHours(22, 0, 0, 0);
  const publishedEndDate = new Date(publishedStartDate);
  publishedEndDate.setUTCHours(23, 45, 0, 0);
  const draftStartDate = new Date();
  draftStartDate.setUTCDate(draftStartDate.getUTCDate() + 60);
  draftStartDate.setUTCHours(21, 0, 0, 0);
  const draftEndDate = new Date(draftStartDate);
  draftEndDate.setUTCHours(23, 0, 0, 0);

  const publishedEvent = await prisma.event.upsert({
    where: { slug: 'festival-luzes-da-cidade' },
    update: {
      organizerId: organizer.id,
      startDate: publishedStartDate,
      endDate: publishedEndDate,
      status: EventStatus.PUBLISHED,
    },
    create: {
      organizerId: organizer.id,
      title: 'Festival Luzes da Cidade',
      slug: 'festival-luzes-da-cidade',
      description:
        'Uma noite de música ao vivo, encontros e experiências no coração da cidade.',
      category: EventCategory.SHOW,
      saleMode: EventSaleMode.GENERAL_ADMISSION,
      venueName: 'Arena Central',
      address: 'Avenida das Artes, 500',
      city: 'São Paulo',
      state: 'SP',
      startDate: publishedStartDate,
      endDate: publishedEndDate,
      posterUrl:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      status: EventStatus.PUBLISHED,
    },
  });

  const demoTicketTypes = [
    {
      name: 'Pista',
      description: 'Acesso à área geral do festival.',
      priceCents: 7000,
      capacity: 300,
    },
    {
      name: 'Pista Premium',
      description: 'Área próxima ao palco com acesso exclusivo.',
      priceCents: 14000,
      capacity: 100,
    },
  ];

  for (const ticketType of demoTicketTypes) {
    await prisma.ticketType.upsert({
      where: {
        eventId_name: { eventId: publishedEvent.id, name: ticketType.name },
      },
      update: {
        description: ticketType.description,
        priceCents: ticketType.priceCents,
      },
      create: {
        eventId: publishedEvent.id,
        ...ticketType,
        availableQuantity: ticketType.capacity,
      },
    });
  }

  await prisma.event.upsert({
    where: { slug: 'mostra-cinema-brasileiro' },
    update: {
      organizerId: organizer.id,
      startDate: draftStartDate,
      endDate: draftEndDate,
      status: EventStatus.DRAFT,
    },
    create: {
      organizerId: organizer.id,
      title: 'Mostra de Cinema Brasileiro',
      slug: 'mostra-cinema-brasileiro',
      description:
        'Sessão especial dedicada a novos talentos do cinema nacional.',
      category: EventCategory.MOVIE,
      saleMode: EventSaleMode.RESERVED_SEATING,
      venueName: 'Cine Aurora',
      address: 'Rua do Cinema, 120',
      city: 'São Paulo',
      state: 'SP',
      startDate: draftStartDate,
      endDate: draftEndDate,
      status: EventStatus.DRAFT,
    },
  });
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
