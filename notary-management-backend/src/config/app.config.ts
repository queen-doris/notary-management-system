export default () => ({
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  version: '1.0.0',
  apiPrefix: '/api/v1',
});
