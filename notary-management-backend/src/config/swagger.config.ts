import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'Rex Backend API',
  description: 'API documentation for Hotel & Restaurant system',
  version: '1.0',
  path: process.env.API_PREFIX || '/api/v1',
}));
