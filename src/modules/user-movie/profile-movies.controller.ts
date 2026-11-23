import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { DefaultValuePipe, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

@Controller('users/:userId')
export class ProfileMoviesController {
   constructor(private readonly userMovieService: UserMovieService) {}

   @ApiProperty({ description: 'Obter filmes assistidos do usuário' })
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

   @ApiProperty({
      description: 'Obter filmes que o usuário adicionou à lista de desejo',
   })
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

   @ApiProperty({ description: 'Obter filmes avaliados pelo usuário' })
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

   @ApiProperty({ description: 'Obter estatísticas de filmes do usuário' })
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
