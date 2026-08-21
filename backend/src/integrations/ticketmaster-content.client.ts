import { Injectable } from '@nestjs/common';

export interface TicketmasterEditorialContent {
  description: string;
  sourceUrl: string;
}

@Injectable()
export class TicketmasterContentClient {
  private readonly cache = new Map<
    string,
    TicketmasterEditorialContent | null
  >();

  async findDescription(
    attractionName: string,
    eventUrl: string | null,
  ): Promise<TicketmasterEditorialContent | null> {
    const slug = this.slugify(attractionName);
    const cacheKey = `${slug}:${eventUrl ?? ''}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) ?? null;

    const candidates = [
      `https://www.ticketmaster.com.br/event/${slug}`,
      eventUrl,
    ].filter((url, index, urls): url is string =>
      Boolean(url && urls.indexOf(url) === index),
    );

    for (const url of candidates) {
      if (!this.isTicketmasterBrazilUrl(url)) continue;

      const html = await this.fetchPage(url);
      const description = html
        ? this.extractEditorialDescription(html, attractionName)
        : null;

      if (description) {
        const result = { description, sourceUrl: url };
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    this.cache.set(cacheKey, null);
    return null;
  }

  private async fetchPage(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'DigiTicket/0.8 (importação de eventos)',
        },
        signal: controller.signal,
      });
      return response.ok ? response.text() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractEditorialDescription(
    html: string,
    attractionName: string,
  ): string | null {
    const blocks = [
      ...html.matchAll(
        /class=['"]block_content['"][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
      ),
    ]
      .map((match) => match[1])
      .map((block) =>
        [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
          .map((paragraph) => this.toPlainText(paragraph[1]))
          .filter((paragraph) => this.isEditorialParagraph(paragraph)),
      )
      .filter((paragraphs) => paragraphs.length > 0);
    const subject = this.normalize(attractionName);
    const bestBlock = blocks
      .filter((paragraphs) =>
        this.normalize(paragraphs.join(' ')).includes(subject),
      )
      .sort((left, right) => right.join(' ').length - left.join(' ').length)[0];

    if (!bestBlock) return null;

    return this.limitDescription(bestBlock.slice(0, 3).join(' '));
  }

  private isEditorialParagraph(value: string): boolean {
    if (value.length < 70) return false;

    const commercialTerms = [
      'pré-venda',
      'venda geral',
      'bilheteria',
      'taxa de serviço',
      'métodos de pagamento',
      'meia-entrada',
      'capacidade total',
      'limite de ingressos',
      'abertura dos portões',
      'serviço –',
    ];
    const normalized = value.toLocaleLowerCase('pt-BR');
    return !commercialTerms.some((term) => normalized.includes(term));
  }

  private limitDescription(value: string): string {
    if (value.length <= 900) return value;

    const shortened = value.slice(0, 900);
    const sentenceEnd = Math.max(
      shortened.lastIndexOf('.'),
      shortened.lastIndexOf('!'),
      shortened.lastIndexOf('?'),
    );
    return sentenceEnd >= 300
      ? shortened.slice(0, sentenceEnd + 1)
      : `${shortened.trimEnd()}...`;
  }

  private toPlainText(value: string): string {
    return value
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#(\d+);/g, (_, code: string) =>
        String.fromCodePoint(Number(code)),
      )
      .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
        String.fromCodePoint(Number.parseInt(code, 16)),
      )
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isTicketmasterBrazilUrl(value: string): boolean {
    try {
      return new URL(value).hostname === 'www.ticketmaster.com.br';
    } catch {
      return false;
    }
  }

  private slugify(value: string): string {
    return this.normalize(value).replace(/\s+/g, '-');
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
