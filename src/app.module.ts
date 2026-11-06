import {
   Module,
   MiddlewareConsumer,
   NestModule,
   RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserRepository } from './modules/user/users.repository';
import { UserModule } from './modules/user/users.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule } from '@nestjs/config';
import { typeormConfig } from './config/typeorm.config';
import { ConfigType } from '@nestjs/config/dist/types/config.type';
import { RoleModule } from './modules/role/role.module';
import { UserRoleModule } from './modules/user-role/user-role.module';
import { AuthModule } from './modules/auth/auth.module';
import { jwtConfig } from './config/jwt.config';
import { LoggerModule } from './modules/logger/logger.module';
import { ApiKeyMiddleware } from './modules/auth/middleware/api-key.middleware';
import { UploadModule } from './modules/upload/upload.module';
import { loggerConfig } from './config/logger.config';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { MovieModule } from './modules/movie/movie.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UserMovieModule } from './modules/user-movie/user-movie.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { FollowModule } from './modules/follow/follow.module';
import { FeedModule } from './modules/feed/feed.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StorageModule } from './modules/storage/storage.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
   imports: [
      ThrottlerModule.forRoot([{ ttl: minutes(1), limit: 100 }]),
      ConfigModule.forRoot({
         isGlobal: true,
         load: [typeormConfig, jwtConfig, loggerConfig],
      }),
      TypeOrmModule.forRootAsync({
         inject: [typeormConfig.KEY],
         useFactory: (config: ConfigType<typeof typeormConfig>) => config,
      }),
      CacheModule.register({
         isGlobal: true,
      }),
      UserModule,
      RoleModule,
      UserRoleModule,
      AuthModule,
      LoggerModule,
      UploadModule,
      TmdbModule,
      MovieModule,
      UserMovieModule,
      FollowModule,
      FeedModule,
      NotificationModule,
      StorageModule,
      ScheduleModule.forRoot(),
   ],
   controllers: [AppController],
   providers: [
      AppService,
      UserRepository,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
   ],
})
export class AppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer
         .apply(ApiKeyMiddleware)
         .exclude('*')
         .forRoutes({ path: '*', method: RequestMethod.ALL });
   }
}
