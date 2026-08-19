export interface ApiHealth {
  status: 'ok';
  service: string;
  timestamp: string;
  database: 'not-configured' | 'configured';
}
