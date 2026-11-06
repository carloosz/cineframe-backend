import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { Upload } from './entities/upload.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from './upload.service';
import { StorageModule } from '../storage/storage.module';

@Module({
   imports: [TypeOrmModule.forFeature([Upload]), StorageModule],
   controllers: [UploadController],
   providers: [UploadService],
   exports: [UploadService],
})
export class UploadModule {}
