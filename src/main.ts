import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EffectInterceptor } from './shared/interceptors/effect.interceptor';
import { GlobalErrorFilter } from './shared/filters/global-error.filter';

async function setupSwagger(app) {
  const options = new DocumentBuilder()
    .setTitle('Clerk Clone API')
    .setDescription('The Clerk Clone API description')
    .setVersion('1.0')
    .addTag('clerk')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Token',
        description: 'Insira o token no formato: Bearer <token>',
      },
      'access-token', // <-- esse é o nome que você vai usar no decorator abaixo
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new EffectInterceptor());
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalGuards();
  setupSwagger(app);
  await app.listen(3000);
}
bootstrap();
