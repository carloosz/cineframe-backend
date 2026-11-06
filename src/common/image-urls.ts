import { cloudinaryUrl, ImagePreset } from './cloudinary-url';
import { UploadType } from '../modules/upload/enum/upload-type.enum';

type WithUploads = {
   uploads?: { active: boolean; type: string; filename: string }[];
} | null;

const activeUrl = (
   user: WithUploads | undefined,
   type: string,
   preset: ImagePreset,
) => {
   const upload = user?.uploads?.find((u) => u.active && u.type === type);
   return upload ? cloudinaryUrl(upload.filename, preset) : null;
};

export const avatarUrl = (
   user?: WithUploads,
   preset: ImagePreset = 'avatarSmall',
) => activeUrl(user, 'avatar', preset);

export const bannerUrl = (user?: WithUploads) =>
   activeUrl(user, 'banner', 'banner');

export const uploadUrls = (upload: { type: string; filename: string }) =>
   upload.type === UploadType.BANNER
      ? {
           url: cloudinaryUrl(upload.filename, 'banner'),
           thumbUrl: cloudinaryUrl(upload.filename, 'bannerSmall'),
        }
      : {
           url: cloudinaryUrl(upload.filename, 'avatar'),
           thumbUrl: cloudinaryUrl(upload.filename, 'avatarSmall'),
        };
