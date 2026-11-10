import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { UserInterface } from '../interfaces/user.interface';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
   IsEmail,
   IsNotEmpty,
   IsString,
   IsBoolean,
   IsOptional,
} from 'class-validator';
import { Upload } from 'src/modules/upload/entities/upload.entity';

@Exclude()
export class UserDto implements UserInterface {
   @Expose()
   id!: string;

   @Expose()
   createdAt!: Date;

   @Expose()
   updatedAt!: Date;

   @Expose()
   @IsString({ message: 'O name deve ser uma string' })
   @ApiProperty({
      description: 'The name of the user',
      example: 'John Doe',
   })
   name!: string;

   @Expose()
   @IsString({ message: 'O nickname deve ser uma string' })
   @ApiProperty({
      description: 'The nickname of the user',
      example: 'johndoe',
   })
   nickname!: string;

   password!: string;

   salt!: string;

   @Expose()
   @ApiProperty({
      description: 'The email of the user',
      example: 'HsCt6@example.com',
   })
   @IsNotEmpty({ message: 'O email deve ser informado' })
   @IsEmail({}, { message: 'O email deve ser um email valido' })
   @IsString({ message: 'O email deve ser uma string' })
   email!: string;

   @Expose()
   @ApiProperty({
      description: 'Whether the user is active',
      example: true,
   })
   @Expose()
   confirmed!: boolean;

   @Expose()
   @Transform(({ obj }) =>
      obj.userRoles?.map((userRole: UserRole) => userRole?.role?.name),
   )
   roles: string[] = [];

   @Expose()
   uploads: Upload[] = [];

   @Expose()
   @ApiProperty({
      description: 'The bio of the user',
      example: 'Hello world',
   })
   @IsString({ message: 'O bio deve ser uma string' })
   bio?: string;

   @Expose()
   @ApiProperty({
      description: 'The location of the user',
      example: 'New York',
   })
   @IsString({ message: 'O location deve ser uma string' })
   location?: string;

   @Expose()
   @ApiProperty({
      description: 'The social media of the user',
      example: 'https://twitter.com/johndoe',
   })
   @IsString({ message: 'O social media deve ser uma string' })
   socialmedia?: string;

   @Expose()
   @ApiProperty({
      description: 'The favorite film genres of the user',
      example: 'Ação, Comédia, Drama',
   })
   @IsString({ message: 'O film genres deve ser uma string' })
   filmGenres?: string;

   @ApiPropertyOptional({ nullable: true })
   @Expose()
   avatar?: string | null;

   @ApiPropertyOptional({ nullable: true })
   @Expose()
   banner?: string | null;

   @Expose()
   @ApiPropertyOptional()
   @IsOptional()
   @IsBoolean({ message: 'emailOnFollow deve ser verdadeiro ou falso' })
   emailOnFollow?: boolean;
}
