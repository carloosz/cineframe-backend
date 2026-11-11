import { env } from 'process';

const PRESETS = {
   avatar: 't_avatar',
   avatarSmall: 't_avatar_sm',
   banner: 't_banner',
   bannerSmall: 't_banner_sm',
} as const;

export type ImagePreset = keyof typeof PRESETS;

export const cloudinaryUrl = (publicId: string, preset: ImagePreset) =>
   `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${PRESETS[preset]}/${publicId}`;
