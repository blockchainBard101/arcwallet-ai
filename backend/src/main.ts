import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Enable comprehensive CORS support for local development environments
  app.enableCors({
    origin: true, // Mirror requested origin to satisfy credential requirements
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`NestJS backend application successfully running on port ${port}`);
}
bootstrap();

