import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './core/filters/http-exception.filter';
import { EnvConfig } from './core/config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envConfig = app.get(EnvConfig);

  app.enableCors({
    origin: envConfig.appConfig.frontendUrl,
    credentials: true,
  });

  // Enforce global request validation DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Register global interceptor and exception filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configure Swagger document builder
  const config = new DocumentBuilder()
    .setTitle('Krumos Project Management API')
    .setDescription('Standardized API document for project management backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
