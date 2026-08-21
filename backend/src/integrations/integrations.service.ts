import { BadRequestException, Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import type { SearchExternalEventsDto } from './dto/search-external-events.dto';
import { TicketmasterClient } from './ticketmaster.client';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly ticketmasterClient: TicketmasterClient,
    private readonly eventsService: EventsService,
  ) {}

  async search(query: SearchExternalEventsDto) {
    const result = await this.ticketmasterClient.search(query);
    const importedIds = await this.eventsService.findImportedExternalIds(
      'TICKETMASTER',
      result.events.map((event) => event.id),
    );
    const importedSet = new Set(importedIds);

    return {
      ...result,
      events: result.events.map((event) => ({
        ...event,
        alreadyImported: importedSet.has(event.id),
        importable: Boolean(event.startDate),
      })),
    };
  }

  async importEvent(externalId: string, organizerId: string) {
    const event = await this.ticketmasterClient.findOne(externalId);

    if (!event.startDate) {
      throw new BadRequestException(
        'Este evento ainda não possui data confirmada para importação.',
      );
    }

    const startDate = new Date(event.startDate);
    const externalEndDate = event.endDate ? new Date(event.endDate) : null;
    const endDate =
      externalEndDate && externalEndDate > startDate
        ? externalEndDate
        : new Date(startDate.getTime() + 3 * 60 * 60 * 1_000);

    return this.eventsService.createExternalDraft(organizerId, {
      title: event.title,
      description: event.description,
      category: event.category,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      state: event.state,
      startDate,
      endDate,
      posterUrl: event.imageUrl,
      externalSource: 'TICKETMASTER',
      externalId: event.id,
    });
  }
}
