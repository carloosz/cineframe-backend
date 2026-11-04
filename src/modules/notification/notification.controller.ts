import {
   Controller,
   Get,
   ParseUUIDPipe,
   Query,
   UseGuards,
   DefaultValuePipe,
   ParseIntPipe,
   Param,
   Patch,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { RoleEnum } from '../role/enum/role.enum';
import { Roles } from '../role/decorator/roles.decorator';
import { RoleGuard } from '../role/guards/role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('notification')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(RoleEnum.Authenticated)
export class NotificationController {
   constructor(private readonly notificationService: NotificationService) {}

   @ApiOperation({ summary: 'Listar notificações' })
   @Get()
   async getNotifications(
      @CurrentUser('id', ParseUUIDPipe) userId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
   ) {
      return this.notificationService.getNotifications(
         userId,
         Math.max(page, 1),
         Math.min(Math.max(limit, 1), 50),
      );
   }

   @ApiOperation({ summary: 'Contar notificações não lidas' })
   @Get('unread-count')
   async unreadCount(@CurrentUser('id', ParseUUIDPipe) userId: string) {
      return this.notificationService.unreadCount(userId);
   }

   @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
   @Patch('read-all')
   async markAllAsRead(@CurrentUser('id', ParseUUIDPipe) userId: string) {
      return this.notificationService.readAll(userId);
   }

   @ApiOperation({ summary: 'Marcar uma notificação como lida' })
   @Patch(':notificationId/read')
   async markAsRead(
      @CurrentUser('id', ParseUUIDPipe) userId: string,
      @Param('notificationId', ParseUUIDPipe) notificationId: string,
   ) {
      return this.notificationService.readOne(userId, notificationId);
   }
}
