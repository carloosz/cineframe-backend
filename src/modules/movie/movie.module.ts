import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { UserMovieModule } from '../user-movie/user-movie.module';

@Module({
   imports: [TmdbModule, UserMovieModule],
   controllers: [MovieController],
   providers: [MovieService],
   exports: [MovieService],
})
export class MovieModule {}
