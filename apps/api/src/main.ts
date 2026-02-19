import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap().catch((err) => {
  console.error('Nest application failed to start', err);
  process.exit(1);
});
