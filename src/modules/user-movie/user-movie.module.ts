import { Module } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { UserMovieController } from './user-movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMovie } from './entities/user-movie.entity';
import { ProfileMoviesController } from './profile-movies.controller';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/users.module';
import { ReviewLike } from './entities/review-like.entity';
import { Follow } from '../follow/entities/follow.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
   controllers: [UserMovieController, ProfileMoviesController],
   providers: [UserMovieService],
   imports: [
      TypeOrmModule.forFeature([UserMovie, User, ReviewLike, Follow]),
      TmdbModule,
      UserModule,
      NotificationModule,
   ],
   exports: [UserMovieService],
})
export class UserMovieModule {}
