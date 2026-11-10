import {
   BadRequestException,
   Injectable,
   NotFoundException,
   InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository, In } from 'typeorm';
import { UserDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from 'src/modules/role/entities/role.entity';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { CryptUtil } from 'src/common/utils/crypt.util';
import { LoggerService } from 'src/modules/logger/logger.service';
import { EmailService } from 'src/modules/email/email.service';
import { TemplateService } from 'src/modules/email/template.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { MoreThanOrEqual, Not } from 'typeorm';
import { FilmGenresEnum } from './enum/film-genres.enum';
import { Upload } from '../upload/entities/upload.entity';
import { randomBytes } from 'crypto';
import { avatarUrl, bannerUrl, uploadUrls } from 'src/common/image-urls';
import { escapeLike } from 'src/common/escape-like';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class UserService {
   constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Role)
      private readonly roleRepository: Repository<Role>,
      @InjectRepository(UserRole)
      private readonly userRoleRepository: Repository<UserRole>,
      private loggerService: LoggerService,
      private readonly emailService: EmailService,
      private readonly templateService: TemplateService,
      private readonly jwtService: JwtService,
      private readonly followService: FollowService,
   ) {
      this.loggerService.setContext(UserService.name);
   }

   private async generateNickname(name: string): Promise<string> {
      const base =
         name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase() || 'user';

      let nickname: string;
      do {
         nickname = `${base}_${Math.floor(Math.random() * 100000)}`;
      } while (await this.userRepository.existsBy({ nickname }));
      return nickname;
   }

   private async createWithDefaults(data: {
      name: string;
      email: string;
      password: string;
      googleId?: string;
      confirmed?: boolean;
   }) {
      const defaultRole = 'authenticated';
      const role = await this.roleRepository.findOneBy({ name: defaultRole });
      if (!role) throw new NotFoundException(`Role ${defaultRole} not found`);

      const userRole = this.userRoleRepository.create({ role });

      const user = this.userRepository.create({
         ...data,
         nickname: await this.generateNickname(data.name),
         userRoles: [userRole],
      });

      return { user: await this.userRepository.save(user), role };
   }

   public async create(createUserDto: CreateUserDto): Promise<UserDto> {
      const email = createUserDto.email.toLowerCase();

      if (await this.userRepository.existsBy({ email })) {
         throw new BadRequestException('Erro: Dados já cadastrados!');
      }

      const { user: savedUser, role } = await this.createWithDefaults({
         ...createUserDto,
         email,
      });

      const token = this.jwtService.sign(
         { sub: savedUser.id, purpose: 'email-confirmation' },
         { expiresIn: '1d' },
      );

      const confirmUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/users/confirm-email/${token}`;

      try {
         await this.emailService.send({
            to: email,
            subject: 'Confirme seu email',
            template: 'confirm-email',
            context: {
               name: savedUser.name,
               confirmUrl: confirmUrl,
            },
         });
      } catch (e) {
         // já logado dentro do EmailService — cadastro segue normal
      }

      return plainToInstance(UserDto, { ...savedUser, roles: [role] });
   }

   public async findAll(): Promise<UserDto[]> {
      this.loggerService.log('Inside findAll');
      const users = await this.userRepository.find({
         relations: {
            userRoles: {
               role: true,
            },
         },
      });

      const formattedUsers = users.map((user) => {
         const roles: Role[] = user.userRoles.map((userRole) => userRole.role);
         return plainToInstance(UserDto, { ...user, roles });
      });

      return formattedUsers;
   }

   public async findOne(id: string): Promise<UserDto> {
      const user = await this.userRepository.findOne({
         where: { id },
         relations: {
            userRoles: {
               role: true,
            },
            uploads: true,
         },
      });

      if (!user) {
         throw new NotFoundException(`Usuário não encontrado`);
      }
      return plainToInstance(UserDto, {
         ...user,
         uploads: [...user.uploads]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // mais novas primeiro
            .map((upload) => ({ ...upload, ...uploadUrls(upload) })),
         avatar: avatarUrl(user, 'avatar'),
         banner: bannerUrl(user),
         roles: user.userRoles.map((userRole) => userRole.role),
      });
   }

   public async update(
      id: string,
      updateUserDto: UpdateUserDto,
   ): Promise<UserDto> {
      const duplicatedNickname = await this.userRepository.findOne({
         where: {
            nickname: updateUserDto.nickname,
            id: Not(id),
         },
      });

      if (duplicatedNickname) {
         throw new BadRequestException('Nickname não disponível');
      }

      await this.userRepository.update({ id }, updateUserDto);
      return await this.findOne(id);
   }

   public async remove(id: string) {
      return await this.userRepository.delete({ id });
   }

   async validateUserPassword(
      email: string,
      password: string,
   ): Promise<UserDto | null> {
      const user = await this.userRepository.findOne({
         where: [{ email }, { nickname: email }],
         relations: {
            userRoles: {
               role: true,
            },
         },
      });

      if (
         user &&
         (await CryptUtil.validatePassword(password, user.password, user.salt))
      ) {
         return plainToInstance(UserDto, user);
      }

      return null;
   }

   async confirmEmailPage(token: string): Promise<string> {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;

      try {
         const payload = this.jwtService.verify(token);

         if (payload.purpose !== 'email-confirmation') {
            throw new Error('Token inválido');
         }

         const user = await this.userRepository.findOneBy({ id: payload.sub });
         if (!user) {
            throw new Error('Usuário não encontrado');
         }

         if (!user.confirmed) {
            user.confirmed = true;
            await this.userRepository.save(user);
         }

         return this.templateService.render('confirm-success', { loginUrl });
      } catch (e: any) {
         const message =
            e.name === 'TokenExpiredError'
               ? 'Esse link expirou. Peça um novo email de confirmação.'
               : 'Esse link de confirmação é inválido.';

         return this.templateService.render('confirm-error', {
            loginUrl,
            message,
         });
      }
   }

   /**
    * Generate a new token for resetToken and
    * add expiration Token date
    *
    * @param email email to try to find the user
    * @param ttlMinutes times in minutes of how long token will be expired
    * @return Promise<User>
    */
   async updateResetTokenByEmail(
      email: string,
      ttlMinutes: number,
   ): Promise<User | undefined> {
      // try to find the user by email
      const user = await this.userRepository.findOne({ where: { email } });

      if (user) {
         return this.updateResetToken(user, ttlMinutes);
      } else {
         return;
      }
   }

   /**
    * Generate a new reset token and save it on user with its expiration date
    *
    * @return User with new info
    * @param user
    * @param ttlMinutes
    */
   private async updateResetToken(
      user: User,
      ttlMinutes: number,
   ): Promise<User | undefined> {
      // current date
      const now = new Date();

      // new user token is a random uuid
      user.resetToken = randomUUID();

      // set the token expiration date
      user.resetTokenExp = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      // call repo to persist it
      return this.userRepository.save(user);
   }

   /**
    * Update password if resetToken is valid
    *
    * @param resetToken rest Token that was sent to the email
    * @return Promise<User | null>
    */
   async updatePassword(
      resetToken: string,
      password: string,
   ): Promise<User | null> {
      // lookup user by reset token and get user with token not expired
      const user = await this.userRepository.findOne({
         where: {
            resetToken,
            resetTokenExp: MoreThanOrEqual<Date>(new Date()),
         },
      });

      // got a user?
      if (user) {
         // yes, set the new password and overwrite token and exp
         user.password = password;
         user.resetToken = null;
         user.resetTokenExp = null;
         // try to save it
         try {
            return this.userRepository.save(user);
         } catch (error) {
            throw new InternalServerErrorException(
               'Updating user password failed.',
            );
         }
      } else {
         throw new NotFoundException('Invalid token');
      }
   }

   async changePassword(
      userId: string,
      currentPassword: string,
      newPassword: string,
      confirmNewPassword: string,
   ): Promise<{ message: string }> {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
         throw new NotFoundException('User not found');
      }

      const isCurrentPasswordValid = await CryptUtil.validatePassword(
         currentPassword,
         user.password,
         user.salt,
      );

      if (!isCurrentPasswordValid) {
         throw new BadRequestException('Senha atual inválida');
      }

      if (newPassword !== confirmNewPassword) {
         throw new BadRequestException('As novas senhas não coincidem');
      }

      user.password = newPassword;

      try {
         await this.userRepository.save(user);
         return { message: 'Password changed successfully' };
      } catch (error) {
         throw new BadRequestException('Falha ao atualizar a senha do usuário');
      }
   }

   async changeFilmGenres(
      userId: string,
      filmGenres: string,
   ): Promise<UserDto> {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
         throw new NotFoundException('User not found');
      }

      const enumValues: string[] = Object.values(FilmGenresEnum);

      const genresArray = filmGenres.split(',').map((genre) => genre.trim());

      const uniqueGenres = new Set(genresArray);

      if (uniqueGenres.size > 5) {
         throw new BadRequestException(
            'You can select up to 5 favorite film genres',
         );
      }

      if (
         !Array.from(uniqueGenres).every((genre) => enumValues.includes(genre))
      ) {
         throw new BadRequestException('Invalid film genres');
      }

      user.filmGenres = Array.from(uniqueGenres).join(',');

      try {
         const updatedUser = await this.userRepository.save(user);
         return plainToInstance(UserDto, updatedUser);
      } catch (error) {
         console.log(error);
         throw new BadRequestException(
            'Falha ao atualizar os gêneros favoritos do usuário ',
         );
      }
   }

   async getUserProfile(userId: string): Promise<UserDto> {
      const user = await this.userRepository.findOne({
         where: { id: userId },
         select: {
            id: true,
            name: true,
            nickname: true,
            bio: true,
            location: true,
            filmGenres: true,
            socialmedia: true,
            createdAt: true,
         },
         relations: {
            uploads: true,
         },
      });

      if (!user) {
         throw new NotFoundException('User not found');
      }

      user.uploads = user.uploads.filter((u) => u.active);

      return plainToInstance(UserDto, user);
   }

   async setUploadActive(userId: string, uploadId: string): Promise<UserDto> {
      const user = await this.userRepository.findOne({
         where: { id: userId },
         relations: { uploads: true },
      });
      if (!user) throw new NotFoundException('Usuário não encontrado');

      const upload = user.uploads.find((u) => u.id === uploadId);
      if (!upload)
         throw new NotFoundException('Erro: Foto ou Banner não encontrado');

      if (!upload.active) {
         const previous = user.uploads.filter(
            (u) => u.active && u.type === upload.type && u.id !== upload.id,
         );

         await this.userRepository.manager.transaction(async (em) => {
            if (previous.length) {
               await em.update(
                  Upload,
                  { id: In(previous.map((u) => u.id)) },
                  { active: false },
               );
            }
            await em.update(Upload, { id: upload.id }, { active: true });
         });

         previous.forEach((u) => (u.active = false));
         upload.active = true;
      }

      return plainToInstance(UserDto, user);
   }

   async createFromGoogle(payload: {
      sub: string;
      email: string;
      name?: string;
   }) {
      const email = payload.email.toLowerCase();

      const { user } = await this.createWithDefaults({
         name: payload.name ?? email.split('@')[0],
         email,
         password: randomBytes(32).toString('hex'), // a entity faz o hash, igual ao cadastro
         googleId: payload.sub,
         confirmed: true, // o Google já verificou o e-mail
      });

      return user;
   }

   async searchPeople(
      query: string,
      viewerId: string | undefined,
      page: number,
      limit: number,
   ) {
      const term = query.trim().replace(/^@/, '');
      if (term.length < 2)
         return { page, totalPages: 0, totalResults: 0, results: [] };

      const like = `%${escapeLike(term)}%`;
      const prefix = `${escapeLike(term)}%`;

      const base = this.userRepository
         .createQueryBuilder('u')
         .where('(u."nickname" ILIKE :like OR u."name" ILIKE :like)', { like })
         .andWhere('u."active" = true');

      const total = await base.getCount();

      const rows = await base
         .clone()
         .select('u.id', 'id')
         .setParameter('prefix', prefix)
         .orderBy(
            'CASE WHEN u."nickname" ILIKE :prefix THEN 0 WHEN u."name" ILIKE :prefix THEN 1 ELSE 2 END',
            'ASC',
         )
         .addOrderBy('u."nickname"', 'ASC')
         .offset((page - 1) * limit)
         .limit(limit)
         .getRawMany<{ id: string }>();

      const results = await this.followService.buildPersonCards(
         rows.map((r) => r.id),
         viewerId,
      );

      return {
         page,
         totalPages: Math.ceil(total / limit),
         totalResults: total,
         results,
      };
   }
}
