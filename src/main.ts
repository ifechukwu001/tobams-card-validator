import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvelopeExceptionFilter } from './common/envelope-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new EnvelopeExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
