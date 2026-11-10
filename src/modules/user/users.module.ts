import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { User } from './entities/user.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { jwtConfig } from 'src/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { Upload } from '../upload/entities/upload.entity';
import { FollowModule } from '../follow/follow.module';

@Module({
   imports: [
      TypeOrmModule.forFeature([User, UserRole, Role, Upload]),
      JwtModule.registerAsync({
         imports: [ConfigModule],
         inject: [jwtConfig.KEY],
         useFactory: (config: ConfigType<typeof jwtConfig>) => ({
            secret: config.access.secret as string,
         }),
      }),
      EmailModule,
      FollowModule,
   ],
   controllers: [UserController],
   providers: [UserService, UserRepository],
   exports: [UserService, UserRepository],
})
export class UserModule {}
