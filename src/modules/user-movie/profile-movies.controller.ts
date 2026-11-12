import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { DefaultValuePipe, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@Controller('users/:userId')
export class ProfileMoviesController {
   constructor(private readonly userMovieService: UserMovieService) {}

   @Get('watched')
   getWatched(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
      @Query('onlyFavorites', new DefaultValuePipe(false))
      onlyFavorites: boolean,
   ) {
      return this.userMovieService.getWatched(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
         onlyFavorites,
      );
   }

   @Get('watchlist')
   getWatchlist(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
   ) {
      return this.userMovieService.getWatchlist(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
      );
   }

   @Get('rateds')
   getRateds(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
   ) {
      return this.userMovieService.getRateds(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
      );
   }

   @Get('stats')
   getStats(@Param('userId', ParseUUIDPipe) userId: string) {
      return this.userMovieService.getStats(userId);
   }

   @Get('genres')
   getFavoriteGenres(
      @Param('userId', ParseUUIDPipe) userId: string,
      @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
      @Query('onlyFavorites', new DefaultValuePipe(false))
      onlyFavorites: boolean,
   ) {
      return this.userMovieService.getFavoriteGenres(
         userId,
         limit,
         onlyFavorites,
      );
   }
}
