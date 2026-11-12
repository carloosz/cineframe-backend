import {
   BadGatewayException,
   Injectable,
   NotFoundException,
   Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
   TmdbGenre,
   TmdbMovieDetails,
   TmdbMovieSummary,
   TmdbPaginated,
} from './tmdb.types';
import { AxiosError } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TmdbCrewMember, TmdbMovieCard } from './tmdb.types';

const HOUR = 60 * 60 * 1000;

@Injectable()
export class TmdbService {
   constructor(
      private readonly http: HttpService,
      @Inject(CACHE_MANAGER) private readonly cache: Cache,
   ) {}

   private async cached<T>(
      key: string,
      ttl: number,
      fetcher: () => Promise<T>,
   ): Promise<T> {
      const hit = await this.cache.get<T>(key);
      if (hit !== undefined && hit !== null) return hit;

      const data = await fetcher();
      await this.cache.set(key, data, ttl);
      return data;
   }

   private async get<T>(
      path: string,
      params: Record<string, any> = {},
   ): Promise<T> {
      try {
         const { data } = await firstValueFrom(
            this.http.get<T>(path, {
               params: { language: 'pt-BR', ...params },
            }),
         );
         return data;
      } catch (e) {
         if (e instanceof AxiosError && e.response?.status === 404) {
            throw new NotFoundException('Filme não encontrado na TMDB');
         }
         throw new BadGatewayException('Erro ao consultar a TMDB');
      }
   }

   trending() {
      return this.cached('tmdb:trending', 1 * HOUR, () =>
         this.get<TmdbPaginated<TmdbMovieSummary>>('/trending/movie/week'),
      );
   }

   nowPlaying() {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/movie/now_playing', {
         region: 'BR',
      });
   }

   upcoming() {
      return this.get<TmdbPaginated<TmdbMovieSummary>>('/movie/upcoming', {
         region: 'BR',
      });
   }

   search(query: string, page = 1) {
      const q = query.trim().toLowerCase();
      return this.cached(`tmdb:search:${q}:${page}`, 30 * 60 * 1000, () =>
         this.get<TmdbPaginated<TmdbMovieSummary>>('/search/movie', {
            query: q,
            page,
         }),
      );
   }

   details(id: number) {
      return this.cached(`tmdb:details:${id}`, 12 * HOUR, () =>
         this.get<TmdbMovieDetails>(`/movie/${id}`, {
            append_to_response: 'credits,videos',
         }),
      );
   }

   recommendations(id: number) {
      return this.get<TmdbPaginated<TmdbMovieSummary>>(
         `/movie/${id}/recommendations`,
      );
   }

   summary(id: number) {
      return this.cached(`tmdb:movie:${id}`, 24 * HOUR, () =>
         this.get<TmdbMovieSummary>(`/movie/${id}`),
      );
   }

   cardWithDirector(id: number) {
      return this.cached(`tmdb:card:${id}`, 24 * HOUR, async () => {
         const m = await this.get<
            TmdbMovieSummary & { credits: { crew: TmdbCrewMember[] } }
         >(`/movie/${id}`, { append_to_response: 'credits' });

         return {
            id: m.id,
            title: m.title,
            release_date: m.release_date,
            poster_path: m.poster_path,
            director:
               m.credits.crew.find((c) => c.job === 'Director')?.name ?? null,
         } satisfies TmdbMovieCard;
      });
   }

   genres() {
      return this.cached('tmdb:genres', 7 * 24 * HOUR, () =>
         this.get<{ genres: TmdbGenre[] }>('/genre/movie/list'),
      );
   }
}
