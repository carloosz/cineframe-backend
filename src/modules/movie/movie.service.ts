import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { TmdbMovieSummary } from '../tmdb/tmdb.types';
import { tmdbImage } from '../../common/tmdb-image';
import { UserMovieService } from '../user-movie/user-movie.service';

const MIN_TMDB_VOTES = 20;
const MIN_COMMUNITY_VOTES = 3;

type Community = { average: number; count: number } | undefined;

const round1 = (n: number) => Math.round(n * 10) / 10;

const img = tmdbImage;

@Injectable()
export class MovieService {
   constructor(
      private readonly tmdb: TmdbService,
      private readonly userMovies: UserMovieService,
   ) {}

   private pickRating(m: TmdbMovieSummary, c?: Community) {
      if (c && c.count >= MIN_COMMUNITY_VOTES) {
         return {
            rating: round1(c.average),
            ratingSource: 'community' as const,
            ratingCount: c.count,
         };
      }
      if (m.vote_count >= MIN_TMDB_VOTES) {
         return {
            rating: round1(m.vote_average / 2),
            ratingSource: 'tmdb' as const,
            ratingCount: m.vote_count,
         };
      }
      return { rating: null, ratingSource: null, ratingCount: 0 };
   }

   private toSummary(m: TmdbMovieSummary, c?: Community) {
      return {
         id: m.id,
         title: m.title,
         year: m.release_date?.slice(0, 4) ?? null,
         ...this.pickRating(m, c),
         poster: img(m.poster_path, 'w500'),
         backdrop: img(m.backdrop_path, 'w1280'),
      };
   }

   async trending() {
      const data = await this.tmdb.trending();
      const movies = data.results.slice(1); // pulando o primeiro, que é o filme da semana

      const ratings = await this.userMovies.getCommunityRatings(
         movies.map((m) => m.id),
      );

      return movies.map((m) => this.toSummary(m, ratings.get(m.id)));
   }

   async search(query: string, page = 1) {
      const q = query?.trim().toLowerCase();

      if (!q) return { page: 1, totalPages: 0, results: [] };

      const data = await this.tmdb.search(q, page);

      return {
         page: data.page,
         totalPages: data.total_pages,
         results: data.results.map((m) => this.toSummary(m)),
      };
   }

   async recommendations(id: number) {
      const data = await this.tmdb.recommendations(id);
      return data.results.slice(0, 10).map((m) => this.toSummary(m));
   }

   async details(id: number) {
      const [m, ratings] = await Promise.all([
         this.tmdb.details(id),
         this.userMovies.getCommunityRatings([id]),
      ]);

      const director = m.credits.crew.find((c) => c.job === 'Director');
      const trailer =
         m.videos.results.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
         ) ??
         m.videos.results.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer',
         );

      return {
         ...this.toSummary(m, ratings.get(m.id)), // id, title, year, rating, poster, backdrop
         overview: m.overview,
         tagline: m.tagline,
         runtime: m.runtime, // minutos, o front formata "2h 18min"
         genres: m.genres.map((g) => g.name),
         director: director?.name ?? null,
         cast: m.credits.cast.slice(0, 8).map((c) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            photo: img(c.profile_path, 'w185'),
         })),
         trailerUrl: trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : null,
         countries: m.production_countries.map((c) => c.name),
         languages: m.spoken_languages.map((l) => l.english_name),
      };
   }

   async featured() {
      const trending = await this.tmdb.trending();
      const first = trending.results[0];
      return this.details(first.id);
   }

   async inTheaters() {
      const [now, soon] = await Promise.all([
         this.tmdb.nowPlaying(),
         this.tmdb.upcoming(),
      ]);

      const nowItems = now.results.slice(0, 3);
      const nowIds = new Set(nowItems.map((m) => m.id));

      // upcoming pode repetir filme que já está em cartaz
      const soonItems = soon.results
         .filter((m) => !nowIds.has(m.id))
         .slice(0, 2);

      const ratings = await this.userMovies.getCommunityRatings(
         [...nowItems, ...soonItems].map((m) => m.id),
      );

      const items = [
         ...nowItems.map((m) => ({
            ...this.toSummary(m, ratings.get(m.id)),
            status: 'now_playing' as const,
         })),
         ...soonItems.map((m) => ({
            ...this.toSummary(m, ratings.get(m.id)),
            status: 'upcoming' as const,
         })),
      ];

      return items;
   }

   async suggest(query: string, limit = 4) {
      const q = query?.trim();
      if (!q || q.length < 2) return []; // so busca se tiver 2 ou mais caracteres

      const data = await this.tmdb.search(q);
      const top = data.results.filter((m) => m.poster_path).slice(0, limit);

      const settled = await Promise.allSettled(
         top.map((m) => this.tmdb.cardWithDirector(m.id)),
      );

      return top.map((m, i) => {
         const s = settled[i];
         return {
            id: m.id,
            title: m.title,
            year: m.release_date?.slice(0, 4) || null,
            poster: img(m.poster_path, 'w154'),
            director: s.status === 'fulfilled' ? s.value.director : null,
         };
      });
   }
}
