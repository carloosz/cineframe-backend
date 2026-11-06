import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (
   req: any,
   file: Express.Multer.File,
   callback: any,
) => {
   if (!/\.(jpe?g|png|gif)$/i.test(file?.originalname ?? '')) {
      return callback(
         new BadRequestException('Envie uma imagem JPG, PNG ou GIF'),
         false,
      );
   }
   callback(null, true);
};
export const editFileName = (
   req: any,
   file: Express.Multer.File,
   callback: any,
) => {
   const name = file.originalname.split('.')[0];
   const fileExtName = extname(file.originalname);
   const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
   callback(null, `${name}-${randomName}${fileExtName}`);
};
