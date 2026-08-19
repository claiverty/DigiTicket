import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'digiticket-api',
      timestamp: new Date().toISOString(),
      database: this.configService.get<string>('DATABASE_URL')
        ? ('configured' as const)
        : ('not-configured' as const),
    };
  }
}
