import {
   Controller,
   Get,
   Param,
   ParseIntPipe,
   Query,
   DefaultValuePipe,
   UseGuards,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { ApiOperation } from '@nestjs/swagger';
import { UserMovieService } from '../user-movie/user-movie.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth-guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ReviewSort } from '../user-movie/enum/review-sort.enum';
import { Throttle, minutes } from '@nestjs/throttler';

@Controller('movies')
export class MovieController {
   constructor(
      private readonly movieService: MovieService,
      private readonly userMovieService: UserMovieService,
   ) {}

   @ApiOperation({ summary: 'Get trending movies' })
   @Get('trending')
   trending() {
      return this.movieService.trending();
   }

   @ApiOperation({ summary: 'Search movies' })
   @Throttle({ default: { limit: 30, ttl: minutes(1) } })
   @Get('search')
   search(@Query('q') q: string, @Query('page') page?: string) {
      return this.movieService.search(q, page ? Number(page) : 1);
   }

   @ApiOperation({
      summary: 'Get movie recommendations based on a specific movie',
   })
   @Get(':id/recommendations')
   recommendations(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.recommendations(id);
   }

   @ApiOperation({ summary: 'Get featured movie of the week' })
   @Get('featured')
   featured() {
      return this.movieService.featured();
   }

   @Get('in-theaters')
   inTheaters() {
      return this.movieService.inTheaters();
   }

   @ApiOperation({ summary: 'Get movie details' })
   @Get(':id')
   details(@Param('id', ParseIntPipe) id: number) {
      return this.movieService.details(id);
   }

   @ApiOperation({ summary: 'Get reviews for a specific movie' })
   @Get(':id/reviews')
   @UseGuards(OptionalJwtAuthGuard)
   reviews(
      @Param('id', ParseIntPipe) id: number,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
      @Query('sort', new DefaultValuePipe('newest')) sort: ReviewSort,
      @CurrentUser('id') userId?: string,
   ) {
      return this.userMovieService.getReviewsByMovie(
         id,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
         sort.trim().toLowerCase() as ReviewSort,
         userId,
      );
   }

   @ApiOperation({ summary: 'Obter críticas em destaque' })
   @Get('reviews/featured')
   @UseGuards(OptionalJwtAuthGuard)
   featuredReviews(
      @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
      @CurrentUser('id') userId?: string,
   ) {
      return this.userMovieService.getFeaturedReviews(
         Math.min(Math.max(limit, 1), 20),
         userId,
      );
   }
}
