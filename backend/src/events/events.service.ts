import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEventDto } from './dto/create-event.dto';
import type { ListEventsQueryDto } from './dto/list-events-query.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(query: ListEventsQueryDto) {
    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      title: query.search?.trim()
        ? { contains: query.search.trim(), mode: 'insensitive' }
        : undefined,
      category: query.category,
      city: query.city?.trim()
        ? { contains: query.city.trim(), mode: 'insensitive' }
        : undefined,
      startDate: query.date ? this.createDateRange(query.date) : undefined,
    };

    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { organizer: { select: { name: true } } },
    });
  }

  async findPublishedBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, status: EventStatus.PUBLISHED },
      include: { organizer: { select: { name: true } } },
    });

    if (!event) {
      throw new NotFoundException('Evento publicado não encontrado.');
    }

    return event;
  }

  listByOrganizer(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByOrganizer(id: string, organizerId: string) {
    return this.requireOwnedEvent(id, organizerId);
  }

  async create(organizerId: string, input: CreateEventDto) {
    this.validateDates(input.startDate, input.endDate);
    const slug = await this.createAvailableSlug(input.title);

    return this.prisma.event.create({
      data: {
        organizerId,
        title: input.title.trim(),
        slug,
        description: input.description.trim(),
        category: input.category,
        saleMode: input.saleMode,
        venueName: input.venueName.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        state: input.state,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        posterUrl: input.posterUrl?.trim() || null,
        status: EventStatus.DRAFT,
      },
    });
  }

  async update(id: string, organizerId: string, input: UpdateEventDto) {
    const event = await this.requireOwnedEvent(id, organizerId);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException(
        'Eventos cancelados não podem ser editados.',
      );
    }

    const startDate = input.startDate ?? event.startDate.toISOString();
    const endDate = input.endDate ?? event.endDate.toISOString();
    this.validateDates(startDate, endDate);

    return this.prisma.event.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        description: input.description?.trim(),
        category: input.category,
        saleMode: input.saleMode,
        venueName: input.venueName?.trim(),
        address: input.address?.trim(),
        city: input.city?.trim(),
        state: input.state,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        posterUrl:
          input.posterUrl === undefined
            ? undefined
            : input.posterUrl.trim() || null,
      },
    });
  }

  async publish(id: string, organizerId: string) {
    const event = await this.requireOwnedEvent(id, organizerId);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException(
        'Um evento cancelado não pode ser publicado.',
      );
    }

    if (event.status === EventStatus.PUBLISHED) {
      return event;
    }

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
    });
  }

  async cancel(id: string, organizerId: string) {
    const event = await this.requireOwnedEvent(id, organizerId);

    if (event.status === EventStatus.CANCELLED) {
      return event;
    }

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
    });
  }

  async removeDraft(id: string, organizerId: string) {
    const event = await this.requireOwnedEvent(id, organizerId);

    // Eventos que já entraram no catálogo preservam o histórico por cancelamento.
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Somente eventos em rascunho podem ser excluídos.',
      );
    }

    await this.prisma.event.delete({ where: { id } });
  }

  private async requireOwnedEvent(id: string, organizerId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, organizerId },
    });

    if (!event) {
      // A mesma resposta evita revelar a existência de eventos de outro organizador.
      throw new NotFoundException('Evento não encontrado.');
    }

    return event;
  }

  private validateDates(startDate: string, endDate: string): void {
    if (new Date(endDate) <= new Date(startDate)) {
      throw new BadRequestException(
        'A data de término deve ser posterior à data de início.',
      );
    }
  }

  private createDateRange(date: string): Prisma.DateTimeFilter {
    const start = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { gte: start, lt: end };
  }

  private async createAvailableSlug(title: string): Promise<string> {
    const base =
      title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'evento';

    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const slug = suffix === 1 ? base : `${base}-${suffix}`;
      const existing = await this.prisma.event.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar uma URL única para este evento.',
    );
  }
}
