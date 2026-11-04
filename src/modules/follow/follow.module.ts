import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../user/entities/user.entity';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { PublicFollowController } from './public-follow.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
   controllers: [FollowController, PublicFollowController],
   providers: [FollowService],
   imports: [
      TypeOrmModule.forFeature([Follow, User, UserMovie]),
      NotificationModule,
   ],
})
export class FollowModule {}
