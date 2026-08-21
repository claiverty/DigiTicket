import {
  BadGatewayException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventCategory } from '@prisma/client';
import type { SearchExternalEventsDto } from './dto/search-external-events.dto';
import type {
  ExternalEvent,
  ExternalEventSearchResult,
  TicketmasterApiEvent,
  TicketmasterSearchResponse,
} from './ticketmaster.types';
import { TicketmasterContentClient } from './ticketmaster-content.client';

@Injectable()
export class TicketmasterClient {
  private readonly baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor(
    private readonly configService: ConfigService,
    private readonly contentClient: TicketmasterContentClient,
  ) {}

  async search(
    query: SearchExternalEventsDto,
  ): Promise<ExternalEventSearchResult> {
    const params = new URLSearchParams({
      apikey: this.requireApiKey(),
      keyword: query.keyword.trim(),
      countryCode: 'BR',
      locale: '*',
      size: '12',
      page: String(query.page),
      sort: 'date,asc',
    });

    if (query.city?.trim()) {
      params.set('city', query.city.trim());
    }

    const response = await this.request<TicketmasterSearchResponse>(
      `${this.baseUrl}/events.json?${params.toString()}`,
    );
    const events = (response._embedded?.events ?? [])
      .map((event) => this.normalizeEvent(event))
      .filter((event): event is ExternalEvent => event !== null);

    return {
      events,
      page: response.page?.number ?? query.page,
      totalPages: response.page?.totalPages ?? 0,
      totalElements: response.page?.totalElements ?? events.length,
    };
  }

  async findOne(id: string): Promise<ExternalEvent> {
    const params = new URLSearchParams({
      apikey: this.requireApiKey(),
      locale: '*',
    });
    const event = await this.request<TicketmasterApiEvent>(
      `${this.baseUrl}/events/${encodeURIComponent(id)}.json?${params.toString()}`,
    );
    let normalized = this.normalizeEvent(event);

    if (!normalized) {
      throw new BadGatewayException(
        'O evento externo não possui os dados mínimos para importação.',
      );
    }

    if (!event.info && !event.pleaseNote && !event.additionalInfo) {
      const attractionName = event._embedded?.attractions?.[0]?.name?.trim();
      const editorial = attractionName
        ? await this.contentClient.findDescription(
            attractionName,
            event.url ?? null,
          )
        : null;

      if (editorial) {
        normalized = {
          ...normalized,
          description: `${editorial.description} ${this.createEventContext(normalized)} Fonte: Ticketmaster Brasil (${editorial.sourceUrl}).`,
        };
      }
    }

    return normalized;
  }

  private async request<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new BadGatewayException(
          'A credencial da integração externa foi recusada.',
        );
      }

      if (response.status === 429) {
        throw new ServiceUnavailableException(
          'O limite temporário da busca externa foi atingido.',
        );
      }

      if (!response.ok) {
        throw new BadGatewayException(
          'A fonte externa não respondeu corretamente.',
        );
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      throw new ServiceUnavailableException(
        'A busca externa está temporariamente indisponível.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private requireApiKey(): string {
    const apiKey = this.configService
      .get<string>('TICKETMASTER_API_KEY')
      ?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Configure TICKETMASTER_API_KEY no backend para habilitar a busca externa.',
      );
    }

    return apiKey;
  }

  private normalizeEvent(event: TicketmasterApiEvent): ExternalEvent | null {
    if (!event.id || !event.name) return null;

    const venue = event._embedded?.venues?.[0];
    const address = [venue?.address?.line1, venue?.address?.line2]
      .filter(Boolean)
      .join(', ');
    const category = this.mapCategory(event);
    const venueName = venue?.name?.trim() || 'local a confirmar';
    const city = venue?.city?.name?.trim() || 'cidade a confirmar';
    const state = this.normalizeState(
      venue?.state?.stateCode ?? venue?.state?.name,
    );
    const startDate = event.dates?.start?.dateTime ?? null;
    const description =
      event.info ??
      event.pleaseNote ??
      event.additionalInfo ??
      this.createFallbackDescription({
        title: event.name,
        category,
        startDate,
        venueName,
        city,
        state,
      });

    return {
      id: event.id,
      title: event.name,
      description,
      category,
      startDate,
      endDate: event.dates?.end?.dateTime ?? null,
      imageUrl: this.selectImage(event),
      sourceUrl: event.url ?? null,
      venueName,
      address: address || 'Endereço a confirmar',
      city,
      state,
    };
  }

  private createFallbackDescription(input: {
    title: string;
    category: EventCategory;
    startDate: string | null;
    venueName: string;
    city: string;
    state: string;
  }): string {
    const categoryLabel: Record<EventCategory, string> = {
      SHOW: 'um show',
      MOVIE: 'uma sessão de cinema',
      THEATER: 'um espetáculo teatral',
      OTHER: 'um evento',
    };
    const dateText = input.startDate
      ? `, programado para ${this.formatDate(input.startDate)}`
      : '';

    return `${input.title} é ${categoryLabel[input.category]}${dateText}, em ${input.city}/${input.state}. A realização será no local ${input.venueName}.`;
  }

  private createEventContext(event: ExternalEvent): string {
    const schedule = event.startDate
      ? `está marcado para ${this.formatDate(event.startDate)}`
      : 'acontece';
    return `O evento ${event.title} ${schedule}, em ${event.city}/${event.state}, no local ${event.venueName}.`;
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(value));
  }

  private mapCategory(event: TicketmasterApiEvent): EventCategory {
    const classification =
      event.classifications?.find((item) => item.primary) ??
      event.classifications?.[0];
    const segment = classification?.segment?.name?.toLowerCase() ?? '';

    if (segment.includes('music')) return EventCategory.SHOW;
    if (segment.includes('arts') || segment.includes('theatre')) {
      return EventCategory.THEATER;
    }
    if (segment.includes('film')) return EventCategory.MOVIE;
    return EventCategory.OTHER;
  }

  private selectImage(event: TicketmasterApiEvent): string | null {
    const images = event.images ?? [];
    const preferred = images
      .filter((image) => image.url && image.ratio === '16_9' && !image.fallback)
      .sort((left, right) => (right.width ?? 0) - (left.width ?? 0))[0];
    const fallback = images.find((image) => image.url);
    return preferred?.url ?? fallback?.url ?? null;
  }

  private normalizeState(value?: string): string {
    const normalized = (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase();

    return normalized.length >= 2 ? normalized.slice(0, 2) : 'NA';
  }
}
