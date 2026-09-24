import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { apiConfig } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // The frontend talks to the API through the dev-server proxy (same origin),
  // but CORS is on so that any other client on another origin can too.
  app.enableCors();
  app.setGlobalPrefix('api');

  const { port } = apiConfig();
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
