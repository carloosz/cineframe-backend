import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { User } from '../user/entities/user.entity';
import { UploadType } from './enum/upload-type.enum';
import { StorageService } from '../storage/storage.service';

const MAX_PHOTOS_PER_TYPE = 5;

@Injectable()
export class UploadService {
   private readonly logger = new Logger(UploadService.name);

   constructor(
      @InjectRepository(Upload)
      private readonly uploadRepository: Repository<Upload>,
      private readonly storage: StorageService,
   ) {}

   async uploadPhoto(
      userId: string,
      type: UploadType,
      file: Express.Multer.File,
   ): Promise<Upload> {
      if (!file?.buffer) {
         throw new BadRequestException('Envie um arquivo no campo "file"');
      }
      // fazer o upload no cloudinary, se falhar aqui, o banco nem é tocado
      const stored = await this.storage.uploadImage(file.buffer, type);

      let upload: Upload;
      try {
         //desativa a atual e cria a nova: ou os dois, ou nenhum
         upload = await this.uploadRepository.manager.transaction(
            async (em) => {
               await em.update(
                  Upload,
                  { user: { id: userId }, type, active: true },
                  { active: false },
               );
               return em.save(
                  em.create(Upload, {
                     filename: stored.public_id, // agora filename e o public_id
                     mimetype: file.mimetype,
                     type,
                     active: true,
                     user: { id: userId } as User,
                  }),
               );
            },
         );
      } catch (e) {
         // não deixa arquivo órfão no Cloudinary se o banco falhou
         await this.storage.delete(stored.public_id).catch(() => undefined);
         throw e;
      }

      await this.enforceMaxPhotos(userId, type).catch((e: Error) =>
         this.logger.warn(`Falha ao limpar fotos antigas: ${e.message}`),
      );

      return upload;
   }

   private async enforceMaxPhotos(userId: string, type: UploadType) {
      const photos = await this.uploadRepository.find({
         where: { user: { id: userId }, type },
         order: { createdAt: 'DESC' },
      });

      for (const photo of photos.slice(MAX_PHOTOS_PER_TYPE)) {
         await this.uploadRepository.delete(photo.id);
         await this.storage
            .delete(photo.filename)
            .catch((e: Error) =>
               this.logger.warn(
                  `Arquivo ${photo.filename} não apagado: ${e.message}`,
               ),
            );
      }
   }
}
