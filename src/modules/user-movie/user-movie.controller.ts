import {
   Controller,
   Put,
   Param,
   ParseIntPipe,
   Body,
   Delete,
   Get,
   ParseUUIDPipe,
} from '@nestjs/common';
import { UserMovieService } from './user-movie.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RateMovieDto } from './dto/rate-movie.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleGuard } from '../role/guards/role.guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { ApiOperation } from '@nestjs/swagger';

@Controller('user-movie')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(RoleEnum.Authenticated)
export class UserMovieController {
   constructor(private readonly userMovieService: UserMovieService) {}

   @ApiOperation({ summary: 'Avaliar filme' })
   @Put(':tmdbId/rating')
   rate(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
      @Body() dto: RateMovieDto,
   ) {
      return this.userMovieService.rateMovie(userId, tmdbId, dto);
   }

   @ApiOperation({ summary: 'Marcar filme como favorito' })
   @Put(':tmdbId/favorite')
   favorite(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setFavorite(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Remover filme dos favoritos' })
   @Delete(':tmdbId/favorite')
   unfavorite(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setFavorite(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Marcar filme como assistido' })
   @Put(':tmdbId/watched')
   watched(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatched(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Marcar filme como não assistido' })
   @Delete(':tmdbId/watched')
   unwatched(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatched(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Adicionar filme à lista de desejo' })
   @Put(':tmdbId/watchlist')
   addToWatchlist(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatchlist(userId, tmdbId, true);
   }

   @ApiOperation({ summary: 'Remover filme da lista de desejo' })
   @Delete(':tmdbId/watchlist')
   removeFromWatchlist(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.setWatchlist(userId, tmdbId, false);
   }

   @ApiOperation({ summary: 'Obter meu estado para um filme' })
   @Get(':tmdbId')
   state(
      @CurrentUser('id') userId: string,
      @Param('tmdbId', ParseIntPipe) tmdbId: number,
   ) {
      return this.userMovieService.getState(userId, tmdbId);
   }

   @ApiOperation({ summary: 'Curtir uma avaliação' })
   @Put('reviews/:reviewId/like')
   likeReview(
      @CurrentUser('id', ParseUUIDPipe) userId: string,
      @Param('reviewId', ParseUUIDPipe) reviewId: string,
   ) {
      return this.userMovieService.likeReview(userId, reviewId);
   }

   @ApiOperation({ summary: 'Remover curtida de uma avaliação' })
   @Delete('reviews/:reviewId/like')
   unlikeReview(
      @CurrentUser('id', ParseUUIDPipe) userId: string,
      @Param('reviewId', ParseUUIDPipe) reviewId: string,
   ) {
      return this.userMovieService.unlikeReview(userId, reviewId);
   }

   @ApiOperation({ summary: 'Obter estatísticas do mês' })
   @Get('me/stats/month')
   monthStats(@CurrentUser('id') userId: string) {
      return this.userMovieService.getMonthStats(userId);
   }
}
