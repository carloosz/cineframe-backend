import { UserUpdatableInterface } from '../interfaces/index';
import { UserDto } from './user.dto';
import { PickType } from '@nestjs/swagger';

export class UpdateUserDto
   extends PickType(UserDto, [
      'name',
      'nickname',
      'active',
      'bio',
      'location',
      'socialmedia',
      'emailOnFollow',
   ])
   implements UserUpdatableInterface {}
