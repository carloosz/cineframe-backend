import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { LoggerModule } from '../logger/logger.module';
import { NotificationTasks } from './notification.tasks';

@Module({
   imports: [
      TypeOrmModule.forFeature([Notification, User]),
      TmdbModule,
      LoggerModule,
   ],
   controllers: [NotificationController],
   providers: [NotificationService, NotificationTasks],
   exports: [NotificationService],
})
export class NotificationModule {}
