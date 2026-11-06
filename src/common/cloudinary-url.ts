import { env } from 'process';

const PRESETS = {
   avatar: 'c_fill,g_auto,w_256,h_256/f_auto/q_auto',
   avatarSmall: 'c_fill,g_auto,w_64,h_64/f_auto/q_auto',
   banner: 'c_fill,g_auto,w_1600,h_400/f_auto/q_auto',
   bannerSmall: 'c_fill,g_auto,w_400,h_100/f_auto/q_auto',
} as const;

export type ImagePreset = keyof typeof PRESETS;

export const cloudinaryUrl = (publicId: string, preset: ImagePreset) =>
   `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${PRESETS[preset]}/${publicId}`;
