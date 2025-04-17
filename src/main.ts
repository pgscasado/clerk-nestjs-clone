import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function setupSwagger(app) {
  const options = new DocumentBuilder()
    .setTitle('Clerk Clone API')
    .setDescription('The Clerk Clone API description')
    .setVersion('1.0')
    .addTag('clerk')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  await app.listen(3000);
}
bootstrap();
