// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
  
  origin: true, //
    credentials: true, // if you plan to use cookies or auth headers
  });

  await app.listen(3000);
}
bootstrap();
