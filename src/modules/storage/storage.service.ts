import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from 'process';

@Injectable()
export class StorageService {
   constructor() {
      cloudinary.config({
         cloud_name: env.CLOUDINARY_CLOUD_NAME,
         api_key: env.CLOUDINARY_API_KEY,
         api_secret: env.CLOUDINARY_API_SECRET,
         secure: true,
      });
   }

   uploadImage(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
      return new Promise((resolve, reject) => {
         cloudinary.uploader
            .upload_stream(
               {
                  folder: `cineframe/${folder}`,
                  resource_type: 'image',
                  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
               },
               (err, result) =>
                  err || !result ? reject(err) : resolve(result),
            )
            .end(buffer);
      });
   }

   async delete(publicId: string) {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
   }
}
