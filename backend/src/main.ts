import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with whitelisted domains for production and local development
  app.enableCors({
    origin: [
      'https://blockgent-ai.vercel.app',
      'https://blockgent-ai.vercel.app/',
      /http:\/\/localhost:\d+$/,
      /http:\/\/127\.0\.0\.1:\d+$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`NestJS backend application successfully running on port ${port}`);
}
// Bootstrap trigger comment for env reload
bootstrap();

