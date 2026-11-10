import { Controller } from '@nestjs/common';
import { Get, Query } from '@nestjs/common';
import { Throttle, minutes } from '@nestjs/throttler';
import { MovieService } from '../movie/movie.service';
import { UserService } from '../user/users.service';

@Controller('search')
export class SearchController {
   constructor(
      private readonly movieService: MovieService,
      private readonly userService: UserService,
   ) {}

   @Get('suggest')
   @Throttle({ default: { limit: 60, ttl: minutes(1) } })
   async suggest(@Query('q') q = '') {
      const text = q.trim();
      const peopleOnly = text.startsWith('@'); //se tiver @ no comeco bnusca so pessoas

      const [movies, people] = await Promise.all([
         peopleOnly
            ? Promise.resolve(
                 [] as Awaited<ReturnType<MovieService['suggest']>>,
              )
            : this.movieService.suggest(text, 4).catch(() => []), // tmdb fora do ar nao derruba as pessoas
         this.userService.suggestPeople(text, 3),
      ]);

      return { movies, people };
   }
}
