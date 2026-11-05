import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './modules/logger/logger.service';
import { LoggerSentryTransport } from './modules/logger/transports/logger-sentry.transport';
import { join } from 'path/win32';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, readdirSync } from 'fs';

const dir = join(process.cwd(), 'files');
console.log('[static]', {
   cwd: process.cwd(),
   dir,
   existe: existsSync(dir),
   arquivos: existsSync(dir) ? readdirSync(dir) : [],
});

async function bootstrap() {
   const app = await NestFactory.create<NestExpressApplication>(AppModule);

   app.set('trust proxy', 1);
   app.useStaticAssets(join(process.cwd(), 'files'), { prefix: '/files' });

   app.useGlobalPipes(
      new ValidationPipe({
         whitelist: true,
         forbidNonWhitelisted: true,
         transform: true,
      }),
   );

   app.useStaticAssets(join(process.cwd(), 'files'), { prefix: '/files' });

   const customLoggerService = app.get(LoggerService);
   const loggerSentryTransport = app.get(LoggerSentryTransport);

   customLoggerService.addTransport(loggerSentryTransport);
   customLoggerService.setContext('bootstrap');

   const docOptions = new DocumentBuilder()
      .setTitle('User API')
      .setDescription('API for managing users')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

   const document = SwaggerModule.createDocument(app, docOptions);

   SwaggerModule.setup('api', app, document);

   await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
