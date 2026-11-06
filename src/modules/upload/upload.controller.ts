import {
   Controller,
   Post,
   UploadedFile,
   UseGuards,
   UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiFileDecorator } from '../../common/decorators/api-file-decorator';
import { imageFileFilter } from '../../common/utils/file-utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleGuard } from '../role/guards/role.guard';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleEnum } from '../role/enum/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { UploadType } from './enum/upload-type.enum';
import { Throttle, minutes } from '@nestjs/throttler';
import { memoryStorage } from 'multer';

const imageUploadOptions = {
   storage: memoryStorage(),
   fileFilter: imageFileFilter,
   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};

//@UseGuards(RolesGuard)
//@UseGuards(JwtAuthGuard)
//@Roles(RoleEnum.Admin)
@ApiTags('upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
   constructor(private readonly uploadService: UploadService) {}

   @Post('avatar')
   @ApiFileDecorator()
   @ApiConsumes('multipart/form-data')
   @UseInterceptors(FileInterceptor('file', imageUploadOptions))
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   @Throttle({ default: { limit: 10, ttl: minutes(1) } })
   async uploadAvatar(
      @UploadedFile() file: Express.Multer.File,
      @CurrentUser('id') userId: string,
   ) {
      return this.uploadService.uploadPhoto(userId, UploadType.AVATAR, file);
   }

   @Post('banner')
   @ApiFileDecorator()
   @ApiConsumes('multipart/form-data')
   @UseInterceptors(FileInterceptor('file', imageUploadOptions))
   @UseGuards(JwtAuthGuard, RoleGuard)
   @Roles(RoleEnum.Authenticated)
   @Throttle({ default: { limit: 10, ttl: minutes(1) } })
   async uploadBanner(
      @UploadedFile() file: Express.Multer.File,
      @CurrentUser('id') userId: string,
   ) {
      return this.uploadService.uploadPhoto(userId, UploadType.BANNER, file);
   }
}
