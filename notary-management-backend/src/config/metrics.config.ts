import { registerAs } from '@nestjs/config';

export default registerAs('metrics', () => ({
  prometheus: process.env.PROMETHEUS_METRICS === 'true',
  otelServiceName: process.env.OTEL_SERVICE_NAME || 'nms-backend',
}));
