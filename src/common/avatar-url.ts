import { env } from 'process';
import { User } from 'src/modules/user/entities/user.entity';

export function avatarUrl(user: User) {
   const activePhoto = user.uploads.find(
      (u) => u.active && u.type === 'avatar',
   );
   return activePhoto ? `${env.API_URL}/files/${activePhoto.filename}` : null;
}
