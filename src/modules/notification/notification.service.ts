import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from './enum/notification-type.enum';
import { Repository, IsNull, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from '../logger/logger.service';
import { Notification } from './entities/notification.entity';
import { TmdbService } from '../tmdb/tmdb.service';
import { User } from '../user/entities/user.entity';
import { avatarUrl } from 'src/common/avatar-url';

@Injectable()
export class NotificationService {
   constructor(
      @InjectRepository(Notification)
      private readonly repo: Repository<Notification>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      private readonly logger: LoggerService,
      private readonly tmdb: TmdbService,
   ) {}

   private async insert(data: Partial<Notification> & { dedupeKey: string }) {
      try {
         await this.repo
            .createQueryBuilder()
            .insert()
            .values(data)
            .orIgnore()
            .execute();
      } catch (e) {
         // notificação é secundária: falhar aqui não pode derrubar o like ou o follow
         this.logger.warn(
            `Falha ao criar notificação: ${(e as Error).message}`,
         );
      }
   }

   notifyLike(
      actorId: string,
      review: { id: string; userId: string; tmdbId: number },
   ) {
      if (actorId === review.userId) return;
      return this.insert({
         recipientId: review.userId,
         actorId,
         type: NotificationType.ReviewLike,
         reviewId: review.id,
         tmdbId: review.tmdbId,
         dedupeKey: `like:${actorId}:${review.id}`,
      });
   }

   notifyFollow(actorId: string, recipientId: string) {
      if (actorId === recipientId) return;
      return this.insert({
         recipientId,
         actorId,
         type: NotificationType.Follow,
         dedupeKey: `follow:${actorId}:${recipientId}`,
      });
   }

   removeLike(actorId: string, reviewId: string) {
      return this.repo.delete({ dedupeKey: `like:${actorId}:${reviewId}` });
   }
   removeFollow(actorId: string, recipientId: string) {
      return this.repo.delete({
         dedupeKey: `follow:${actorId}:${recipientId}`,
      });
   }
   removeByReview(reviewId: string) {
      return this.repo.delete({ reviewId, type: NotificationType.ReviewLike });
   }

   async getNotifications(userId: string, page: number, limit: number) {
      console.log('page', page, 'limit', limit);
      const [[rows, total], unreadCount] = await Promise.all([
         this.repo.findAndCount({
            where: { recipientId: userId },
            order: { createdAt: 'DESC', id: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
         }),
         this.repo.countBy({ recipientId: userId, readAt: IsNull() }),
      ]);

      const base = {
         page,
         totalPages: Math.ceil(total / limit),
         totalResults: total,
         unreadCount,
      };
      if (!rows.length) return { ...base, results: [] };

      const actorIds = [...new Set(rows.map((n) => n.actorId))];
      const tmdbIds = [
         ...new Set(
            rows.map((n) => n.tmdbId).filter((id): id is number => id !== null),
         ),
      ];

      const [actors, settled] = await Promise.all([
         this.userRepository.find({
            where: { id: In(actorIds) },
            select: { id: true, nickname: true },
            relations: { uploads: true },
         }),
         Promise.allSettled(tmdbIds.map((id) => this.tmdb.summary(id))),
      ]);

      const actorById = new Map(actors.map((a) => [a.id, a]));
      const titleById = new Map<number, string>();
      for (const s of settled) {
         if (s.status === 'fulfilled') titleById.set(s.value.id, s.value.title);
      }

      const results = rows.flatMap((n) => {
         const actor = actorById.get(n.actorId);
         if (!actor) return [];

         const title = n.tmdbId !== null ? titleById.get(n.tmdbId) : undefined;
         return [
            {
               id: n.id,
               type: n.type,
               read: n.readAt !== null,
               createdAt: n.createdAt,
               actor: {
                  id: actor.id,
                  nickname: actor.nickname,
                  avatar: avatarUrl(actor),
               },
               movie:
                  title && n.tmdbId !== null ? { id: n.tmdbId, title } : null,
               reviewId: n.reviewId,
            },
         ];
      });

      return { ...base, results };
   }

   async unreadCount(userId: string) {
      const count = await this.repo.countBy({
         recipientId: userId,
         readAt: IsNull(),
      });
      return { count };
   }

   async readAll(userId: string) {
      await this.repo.update(
         { recipientId: userId, readAt: IsNull() },
         { readAt: new Date() },
      );
      return { updated: true };
   }

   async readOne(userId: string, notificationId: string) {
      const n = await this.repo.findOneBy({
         id: notificationId,
         recipientId: userId,
      });
      if (!n) throw new NotFoundException('Notificação não encontrada');

      if (n.readAt === null) {
         n.readAt = new Date();
         await this.repo.save(n);
      }
      return { updated: true };
   }
}
