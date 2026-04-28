import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'NMS Backend API',
  description: 'API documentation Notary Management System',
  version: '1.0',
  path: process.env.API_PREFIX || '/api/v1',
}));
