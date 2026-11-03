import {
   Injectable,
   BadRequestException,
   NotFoundException,
} from '@nestjs/common';
import { Repository, In, Not, IsNull, ILike } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserMovie } from '../user-movie/entities/user-movie.entity';
import { env } from 'process';
import { escapeLike } from 'src/common/escape-like';
import { RoleEnum } from '../role/enum/role.enum';

@Injectable()
export class FollowService {
   constructor(
      @InjectRepository(Follow)
      private readonly followRepository: Repository<Follow>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(UserMovie)
      private readonly userMovieRepository: Repository<UserMovie>,
   ) {}

   async follow(loggedUserId: string, targetUserId: string) {
      if (loggedUserId === targetUserId) {
         throw new BadRequestException('Você não pode seguir a si mesmo');
      }

      const exists = await this.userRepository.existsBy({ id: targetUserId });
      if (!exists) throw new NotFoundException('Usuário não encontrado');

      await this.followRepository
         .createQueryBuilder()
         .insert()
         .values({
            follower: { id: loggedUserId },
            following: { id: targetUserId },
         })
         .orIgnore()
         .execute();

      return { following: true };
   }

   async unfollow(loggedUserId: string, targetUserId: string) {
      await this.followRepository.delete({
         follower: { id: loggedUserId },
         following: { id: targetUserId },
      });

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
            const formatUrl = activePhoto
               ? `${env.API_URL}/files/${activePhoto.filename}`
               : null;
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

   async whoToFollow(loggedUserId: string, limit = 6) {
      const followings = await this.followRepository.find({
         where: { followerId: loggedUserId },
         select: { followingId: true },
      });

      const followingsIds = new Set(followings.map((f) => f.followingId));

      const usersToFollow = await this.userRepository.find({
         where: {
            id: Not(In([...followingsIds, loggedUserId])),
            userRoles: { role: { name: RoleEnum.Authenticated } },
         },
         select: { id: true, name: true, nickname: true },
         relations: { uploads: true },
         take: limit,
      });

      const usersWithPhoto =
         (await Promise.all(
            usersToFollow.map(async (u) => {
               const activePhoto = u.uploads.find(
                  (upload) => upload.active && upload.type === 'avatar',
               );
               const formatUrl = activePhoto
                  ? `${env.API_URL}/files/${activePhoto.filename}`
                  : null;
               const follows = await this.followRepository.find({
                  where: { followerId: u.id },
                  select: { followingId: true },
               });
               return {
                  ...u,
                  photo: formatUrl,
                  uploads: undefined,
                  commonFollowers: follows.filter((x) =>
                     followingsIds.has(x.followingId),
                  ).length,
               };
            }),
         )) || [];

      return usersWithPhoto;
   }
}
