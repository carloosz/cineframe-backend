import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { PublicFollowController } from './public-follow.controller';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
   controllers: [FollowController, PublicFollowController],
   providers: [FollowService],
   imports: [
      TypeOrmModule.forFeature([Follow, User, UserMovie]),
      NotificationModule,
      EmailModule,
      LoggerModule,
   ],
})
export class FollowModule {}
