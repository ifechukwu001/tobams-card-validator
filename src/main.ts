import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { EnvelopeExceptionFilter } from './common/envelope-exception.filter.js';
import { ResponseInterceptor } from './common/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new EnvelopeExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
