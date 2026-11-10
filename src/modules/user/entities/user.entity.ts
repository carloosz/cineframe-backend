import { Entity } from 'typeorm';
import { UserInterface } from '../interfaces/index';
import { Unique } from 'typeorm';
import { CommonEntity } from '../../../common/common.entity';
import { Column, OneToMany } from 'typeorm';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { Upload } from 'src/modules/upload/entities/upload.entity';

@Entity()
@Unique(['nickname', 'email'])
export class User extends CommonEntity implements UserInterface {
   @Column({ type: 'citext', nullable: false })
   name!: string;

   @Column({ type: 'text', nullable: false })
   password!: string;

   @Column({ type: 'text', nullable: false, default: 'salt' })
   salt!: string;

   @Column({ type: 'citext', nullable: false })
   nickname!: string;

   @Column({ type: 'citext', nullable: false })
   email!: string;

   @Column({ type: 'boolean', nullable: false, default: true })
   active!: boolean;

   @OneToMany(() => UserRole, (userRole) => userRole.user, {
      cascade: true,
   })
   userRoles!: UserRole[];

   @Column({ type: 'boolean', nullable: false, default: false })
   confirmed?: boolean;

   @OneToMany(() => Upload, (upload) => upload.user)
   uploads!: Upload[];

   @Column({ type: 'uuid', nullable: true })
   resetToken!: string | null;

   @Column({ type: 'timestamp', nullable: true })
   resetTokenExp!: Date | null;

   @Column({ type: 'text', nullable: true })
   bio!: string;

   @Column({ type: 'text', nullable: true })
   location!: string;

   @Column({ type: 'text', nullable: true })
   socialmedia!: string;

   @Column({ type: 'text', nullable: true })
   filmGenres!: string;

   @Column({ type: 'varchar', nullable: true, unique: true })
   googleId!: string | null;

   @Column({ type: 'boolean', default: true })
   emailOnFollow!: boolean;
}
