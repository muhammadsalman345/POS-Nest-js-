import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { uploadsRoot } from './common/utils/uploads.util';

const defaultCorsOrigins = [
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];

const quickTunnelOriginPattern = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i;

function configuredCorsOrigins(): string[] {
  return [
    ...defaultCorsOrigins,
    ...(process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];
}

function isAllowedCorsOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin) || quickTunnelOriginPattern.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsRoot));
  const corsOrigins = configuredCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedCorsOrigin(origin, corsOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Second-Hand Mobile POS API')
    .setDescription('POS, inventory, marketplace, and compliance backend for second-hand mobile shops.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
