import {
   Injectable,
   BadRequestException,
   NotFoundException,
   Inject,
} from '@nestjs/common';
import { Repository, In, Not, IsNull, ILike } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { env } from 'process';
import { escapeLike } from 'src/common/escape-like';
import { RoleEnum } from '../role/enum/role.enum';
import { NotificationService } from '../notification/notification.service';
import { avatarUrl } from 'src/common/image-urls';
import { EmailService } from '../email/email.service';
import { LoggerService } from '../logger/logger.service';
import { CACHE_MANAGER } from 'node_modules/@nestjs/cache-manager/dist/cache.constants';
import type { Cache } from 'cache-manager';

@Injectable()
export class FollowService {
   constructor(
      @InjectRepository(Follow)
      private readonly followRepository: Repository<Follow>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(UserMovie)
      private readonly userMovieRepository: Repository<UserMovie>,
      private readonly notificationService: NotificationService,
      @Inject(CACHE_MANAGER)
      private cache: Cache,
      private readonly emailService: EmailService,
      private readonly logger: LoggerService,
   ) {}

   private async sendFollowEmail(actorId: string, recipientId: string) {
      try {
         const key = `follow-email:${actorId}:${recipientId}`;
         if (await this.cache.get(key)) return;

         const [recipient, actor, followers, following] = await Promise.all([
            this.userRepository.findOne({
               where: { id: recipientId },
               select: {
                  id: true,
                  name: true,
                  email: true,
                  confirmed: true,
                  active: true,
                  emailOnFollow: true,
               },
            }),
            this.userRepository.findOne({
               where: { id: actorId },
               select: { id: true, nickname: true },
               relations: { uploads: true },
            }),
            this.followRepository.countBy({ followingId: actorId }),
            this.followRepository.countBy({ followerId: actorId }),
         ]);

         if (
            !recipient?.confirmed ||
            !recipient.active ||
            !actor ||
            !recipient.emailOnFollow
         )
            return;

         await this.emailService.send({
            to: recipient.email,
            subject: `@${actor.nickname} começou a te seguir`,
            template: 'new-follower',
            context: {
               recipientName: recipient.name,
               actorNickname: actor.nickname,
               actorAvatar: avatarUrl(actor), // URL absoluta, ou null
               actorInitial: actor.nickname.charAt(0).toUpperCase(),
               followers,
               following,
               profileUrl: `${env.FRONTEND_URL}/perfil/${actor.id}`,
            },
         });

         await this.cache.set(key, true, 7 * 24 * 60 * 60 * 1000); // 7 dias em ms
      } catch (e) {
         this.logger.warn(
            `Falha ao enviar email de novo seguidor: ${(e as Error).message}`,
         );
      }
   }
   async follow(loggedUserId: string, targetUserId: string) {
      if (loggedUserId === targetUserId) {
         throw new BadRequestException('Você não pode seguir a si mesmo');
      }

      const exists = await this.userRepository.existsBy({ id: targetUserId });
      if (!exists) throw new NotFoundException('Usuário não encontrado');

      const alreadyFollowing = await this.followRepository.existsBy({
         followerId: loggedUserId,
         followingId: targetUserId,
      });

      await this.followRepository
         .createQueryBuilder()
         .insert()
         .values({
            follower: { id: loggedUserId },
            following: { id: targetUserId },
         })
         .orIgnore()
         .execute();

      await this.notificationService.notifyFollow(loggedUserId, targetUserId);

      if (!alreadyFollowing) {
         await this.sendFollowEmail(loggedUserId, targetUserId);
      }

      return { following: true };
   }

   async unfollow(loggedUserId: string, targetUserId: string) {
      await this.followRepository.delete({
         follower: { id: loggedUserId },
         following: { id: targetUserId },
      });

      await this.notificationService.removeFollow(loggedUserId, targetUserId);

      return { following: false };
   }

   async listUserFollowers(
      userId: string,
      loggedUserId?: string,
      page = 1,
      limit = 6,
      search?: string,
      isFollowing?: boolean,
   ) {
      const exists = await this.userRepository.existsBy({ id: userId });
      if (!exists) throw new NotFoundException('Usuário não encontrado');

      const term = search?.trim();
      const formattedSearch = term ? `%${escapeLike(term)}%` : null;

      const key = isFollowing ? 'followerId' : 'followingId';

      const [[followRows, total], MyFollowingsIds, MyFollowersIds] =
         await Promise.all([
            this.followRepository.findAndCount({
               where: {
                  [key]: userId,
                  ...(formattedSearch && {
                     [isFollowing ? 'following' : 'follower']: [
                        { name: ILike(`%${formattedSearch}%`) },
                        { nickname: ILike(`%${formattedSearch}%`) },
                     ],
                  }),
               },
               select: {
                  id: true,
                  followerId: isFollowing === false,
                  followingId: isFollowing,
               },
               order: { id: 'ASC' },
               skip: (page - 1) * limit,
               take: limit,
            }),
            loggedUserId
               ? this.followRepository.find({
                    where: { followerId: loggedUserId },
                    select: { followingId: true },
                 })
               : null,
            loggedUserId
               ? this.followRepository.find({
                    where: { followingId: loggedUserId },
                    select: { followerId: true },
                 })
               : null,
         ]);

      if (!followRows.length) {
         return {
            page,
            totalPages: Math.ceil(total / limit),
            totalResults: total,
            results: [],
         };
      }

      const followers = await this.userRepository.find({
         where: {
            id: In(followRows.map((f) => f.followerId || f.followingId)),
         },
         select: { id: true, name: true, nickname: true },
         relations: { uploads: true },
      });

      const myFollowersSet = new Set(
         (MyFollowersIds ?? []).map((x) => x.followerId),
      );
      const myFollowingSet = new Set(
         (MyFollowingsIds ?? []).map((x) => x.followingId),
      );

      const followersWithAllInfos = await Promise.all(
         followers.map(async (f) => {
            const [follows, reviews] = await Promise.all([
               this.followRepository.find({
                  where: { followerId: f.id },
                  select: { id: true, followingId: true },
               }),
               this.userMovieRepository.count({
                  where: { userId: f.id, review: Not(IsNull()) },
                  select: { id: true, review: true },
               }),
            ]);

            const activePhoto = f.uploads.find(
               (u) => u.active && u.type === 'avatar',
            );
            const formatUrl = avatarUrl(f, 'avatar');
            return {
               ...f,
               photo: formatUrl,
               following: myFollowingSet.has(f.id), // eu sigo esse usuário?
               isMyFollower: myFollowersSet.has(f.id), // esse usuário me segue?
               uploads: undefined,
               commonFollowers: follows.filter((x) =>
                  myFollowingSet.has(x.followingId),
               ).length,
               reviews,
            };
         }),
      );

      return {
         page,
         totalPages: Math.ceil(total / limit),
         totalResults: total,
         results: followersWithAllInfos,
      };
   }

   async whoToFollow(me: string, limit = 3) {
      const wanted = limit * 2; // folga: alguns candidatos podem cair no filtro final
      const notFollowedByMe =
         'NOT IN (SELECT x."followingId" FROM follow x WHERE x."followerId" = :me)';

      const mutual = await this.followRepository
         .createQueryBuilder('f2')
         .select('f2.followingId', 'userId')
         .addSelect('COUNT(*)', 'common')
         .innerJoin(
            Follow,
            'f1',
            'f1."followingId" = f2."followerId" AND f1."followerId" = :me',
            { me },
         )
         .where('f2."followingId" <> :me', { me })
         .andWhere(`f2."followingId" ${notFollowedByMe}`, { me })
         .groupBy('f2.followingId')
         .orderBy('COUNT(*)', 'DESC')
         .limit(wanted)
         .getRawMany<{ userId: string; common: string }>();

      const followBack = await this.followRepository
         .createQueryBuilder('f')
         .select('f.followerId', 'userId')
         .where('f."followingId" = :me', { me })
         .andWhere(`f."followerId" ${notFollowedByMe}`, { me })
         .orderBy('f."createdAt"', 'DESC')
         .limit(wanted)
         .getRawMany<{ userId: string }>();

      const recent = await this.userRepository
         .createQueryBuilder('u')
         .select('u.id', 'userId')
         .where('u.id <> :me', { me })
         .andWhere(`u.id ${notFollowedByMe}`, { me })
         .orderBy('u."createdAt"', 'DESC')
         .limit(wanted)
         .getRawMany<{ userId: string }>();

      const commonBy = new Map(mutual.map((m) => [m.userId, Number(m.common)]));
      const ids = [
         ...new Set([...mutual, ...followBack, ...recent].map((r) => r.userId)),
      ];
      if (!ids.length) return [];

      const users = await this.userRepository.find({
         where: {
            id: In(ids),
            active: true,
            userRoles: { role: { name: RoleEnum.Authenticated } },
         },
         select: { id: true, name: true, nickname: true },
         relations: { uploads: true },
      });
      const byId = new Map(users.map((u) => [u.id, u]));

      return ids
         .flatMap((id) => {
            const u = byId.get(id);
            if (!u) return []; // desativado ou sem a role
            return [
               {
                  id,
                  name: u.name,
                  nickname: u.nickname,
                  photo: avatarUrl(u),
                  commonFollowers: commonBy.get(id) ?? 0,
               },
            ];
         })
         .slice(0, limit);
   }

   async buildPersonCards(ids: string[], loggedUserId?: string) {
      if (!ids.length) return [];

      const [users, reviewCounts, iFollow, followMe, commons] =
         await Promise.all([
            this.userRepository.find({
               where: { id: In(ids) },
               select: { id: true, name: true, nickname: true },
               relations: { uploads: true },
            }),
            // críticas escritas por cada pessoa
            this.userMovieRepository
               .createQueryBuilder('um')
               .select('um.userId', 'userId')
               .addSelect('COUNT(*)', 'count')
               .where('um.userId IN (:...ids)', { ids })
               .andWhere('um.review IS NOT NULL')
               .groupBy('um.userId')
               .getRawMany<{ userId: string; count: string }>(),
            // quem desta lista eu sigo
            loggedUserId
               ? this.followRepository.find({
                    where: { followerId: loggedUserId, followingId: In(ids) },
                    select: { followingId: true },
                 })
               : Promise.resolve([] as Follow[]),
            // quem desta lista me segue
            loggedUserId
               ? this.followRepository.find({
                    where: { followingId: loggedUserId, followerId: In(ids) },
                    select: { followerId: true },
                 })
               : Promise.resolve([] as Follow[]),
            // amigos em comum
            loggedUserId
               ? this.followRepository
                    .createQueryBuilder('f')
                    .select('f.followerId', 'userId')
                    .addSelect('COUNT(*)', 'count')
                    .where('f.followerId IN (:...ids)', { ids })
                    .andWhere(
                       'f."followingId" IN (SELECT m."followingId" FROM follow m WHERE m."followerId" = :me)',
                       { me: loggedUserId },
                    )
                    .groupBy('f.followerId')
                    .getRawMany<{ userId: string; count: string }>()
               : Promise.resolve([] as { userId: string; count: string }[]),
         ]);

      const userById = new Map(users.map((u) => [u.id, u]));
      const reviewsBy = new Map(
         reviewCounts.map((r) => [r.userId, Number(r.count)]),
      );
      const commonBy = new Map(commons.map((r) => [r.userId, Number(r.count)]));
      const iFollowSet = new Set(iFollow.map((x) => x.followingId));
      const followMeSet = new Set(followMe.map((x) => x.followerId));

      return ids.flatMap((id) => {
         const u = userById.get(id);
         if (!u) return [];
         return [
            {
               id,
               name: u.name,
               nickname: u.nickname,
               photo: avatarUrl(u),
               following: iFollowSet.has(id),
               isMyFollower: followMeSet.has(id),
               isMe: id === loggedUserId,
               commonFollowers: commonBy.get(id) ?? 0,
               reviews: reviewsBy.get(id) ?? 0,
            },
         ];
      });
   }
}
