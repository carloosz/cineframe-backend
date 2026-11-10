import {
   Controller,
   Get,
   Post,
   Body,
   Patch,
   Delete,
   Param,
   Res,
   UseGuards,
   ParseUUIDPipe,
   Query,
   DefaultValuePipe,
   ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IsUUIDParam } from '../../common/decorators/is-uuidparam.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleGuard } from '../role/guards/role.guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeFilmGenresDto } from './dto/change-film-genres.dto';
import { Throttle, minutes } from '@nestjs/throttler';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth-guard';

@ApiTags('users')
@Controller('users')
export class UserController {
   constructor(private readonly userService: UserService) {}

   @ApiOperation({ summary: 'Create user' })
   @ApiOkResponse({ description: 'User created successfully' })
   @Throttle({ default: { limit: 5, ttl: minutes(1) } })
   @Post()
   create(@Body() createUserDto: CreateUserDto) {
      return this.userService.create(createUserDto);
   }

   @ApiOperation({ summary: 'Find all users' })
   @Get()
   findAll() {
      return this.userService.findAll();
   }

   @Get('confirm-email/:token')
   async confirmEmail(@Param('token') token: string, @Res() res: Response) {
      const html = await this.userService.confirmEmailPage(token);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
   }

   @ApiOperation({ summary: 'Find logged user' })
   @Get('me')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   me(@CurrentUser() user: User) {
      return this.userService.findOne(user.id);
   }

   @ApiOperation({ summary: 'Pesquisar usuários' })
   @Get('search')
   @UseGuards(OptionalJwtAuthGuard) // o flag "seguindo" depende de quem pesquisa
   @Throttle({ default: { limit: 30, ttl: minutes(1) } })
   searchUsers(
      @Query('q') q = '',
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
      @CurrentUser('id') userId?: string,
   ) {
      return this.userService.searchPeople(
         q,
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 30),
      );
   }

   @ApiOperation({ summary: 'Find one user' })
   @Get(':id')
   async findOne(@IsUUIDParam('id') id: string) {
      return await this.userService.findOne(id);
   }

   @ApiOperation({ summary: 'Update logged user' })
   @Patch('edit-my-account')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   update(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
      return this.userService.update(user.id, updateUserDto);
   }

   @ApiOperation({ summary: 'Delete logged user' })
   @Delete('delete-my-account')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   remove(@CurrentUser() user: User) {
      return this.userService.remove(user.id);
   }

   @ApiOperation({ summary: 'Change logged user password' })
   @Patch('change-password')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   async changePassword(
      @CurrentUser() user: User,
      @Body() changePasswordDto: ChangePasswordDto,
   ) {
      return await this.userService.changePassword(
         user.id,
         changePasswordDto.currentPassword,
         changePasswordDto.newPassword,
         changePasswordDto.confirmNewPassword,
      );
   }

   @ApiOperation({ summary: 'Change logged user favorite film genres' })
   @Patch('change-film-genres')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   async changeFilmGenres(
      @CurrentUser() user: User,
      @Body() changeFilmGenresDto: ChangeFilmGenresDto,
   ) {
      return await this.userService.changeFilmGenres(
         user.id,
         changeFilmGenresDto.filmGenres,
      );
   }

   @ApiOperation({ summary: 'Get any user by id' })
   @Throttle({ default: { limit: 50, ttl: minutes(1) } })
   @Get(':userId/profile')
   async getUserProfile(@Param('userId', ParseUUIDPipe) userId: string) {
      return await this.userService.getUserProfile(userId);
   }

   @ApiOperation({ summary: 'Set active some existing upload' })
   @Patch(':uploadId/set-upload-active')
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   async setUploadActive(
      @Param('uploadId', ParseUUIDPipe) uploadId: string,
      @CurrentUser('id', ParseUUIDPipe) userId: string,
   ) {
      return this.userService.setUploadActive(userId, uploadId);
   }
}
