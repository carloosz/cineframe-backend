import { CommonEntity } from 'src/common/common.entity';
import { UserRole } from 'src/modules/user-role/entities/user-role.entity';
import { Column, Entity, OneToMany, Unique } from 'typeorm';

@Entity('roles')
@Unique(['name'])
export class Role extends CommonEntity {
   @Column({ unique: true })
   name!: string;

   @OneToMany(() => UserRole, (userRole) => userRole.role)
   userRoles!: UserRole[];
}
