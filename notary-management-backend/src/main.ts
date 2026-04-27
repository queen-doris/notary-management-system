import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const isProduction = process.env.NODE_ENV === 'production';
  const assetsPath = isProduction
    ? join(__dirname, 'assets')
    : join(__dirname, '..', 'src', 'assets');

  app.useStaticAssets(assetsPath, {
    prefix: '/assets/',
  });

  Logger.log(`Static assets serving from: ${assetsPath}`);
  Logger.log(`Logo should be accessible at: /assets/rex.jpeg`);

  const corsOptions: CorsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  };

  app.enableCors(corsOptions);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  /**
   * API Prefix
   */
  const gp: string = 'api/v1';
  app.setGlobalPrefix(gp);

  /**
   * SWAGGER
   */
  const options = new DocumentBuilder()
    .setTitle('Notary Management System Backend APIs')
    .setDescription('Backend APIs documentation for Notary Managent System.')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )

    .build();

  const document = SwaggerModule.createDocument(app, options);
  document.tags = (document.tags || []).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  document.paths = Object.keys(document.paths)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = document.paths[key];
      return acc;
    }, {});

  SwaggerModule.setup('api/v1/swagger-ui.html', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap()
  .then(() => {
    Logger.log(
      `Application running on http://localhost:${process.env.PORT ?? 3000} (reachable from LAN at your machine's IP)`,
    );
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
