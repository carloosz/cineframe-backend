import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

const RETENTION_DAYS = 90;

@Injectable()
export class NotificationTasks {
   private readonly logger = new Logger(NotificationTasks.name);

   constructor(
      @InjectRepository(Notification)
      private readonly repo: Repository<Notification>,
   ) {}

   @Cron('0 0 3 * * *', {
      name: 'cleanup-old-notifications',
      timeZone: 'America/Sao_Paulo',
      waitForCompletion: true,
   })
   async cleanupOldNotifications() {
      try {
         const cutoff = new Date(
            Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
         );
         const result = await this.repo.delete({ createdAt: LessThan(cutoff) });
         this.logger.log(
            `Notificações antigas removidas: ${result.affected ?? 0}`,
         );
      } catch (e) {
         this.logger.error(
            `Falha na limpeza de notificações: ${(e as Error).message}`,
         );
      }
   }
}
