import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CommonEntity } from 'src/common/common.entity';
import { User } from '../../user/entities/user.entity';
import { UserMovie } from '../../user-movie/entities/user-movie.entity';
import { NotificationType } from '../enum/notification-type.enum';

@Entity('notification')
@Index(['recipientId', 'createdAt'])
@Unique(['dedupeKey'])
export class Notification extends CommonEntity {
   @Column() recipientId!: string; // quem recebe
   @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'recipientId' })
   recipient!: User;

   @Column() actorId!: string; // quem fez a ação
   @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'actorId' })
   actor!: User;

   @Column({ type: 'varchar' }) type!: NotificationType;

   @Column({ type: 'uuid', nullable: true }) reviewId!: string | null; // user_movie.id
   @ManyToOne(() => UserMovie, { onDelete: 'CASCADE', nullable: true })
   @JoinColumn({ name: 'reviewId' })
   review!: UserMovie | null;

   @Column({ type: 'int', nullable: true }) tmdbId!: number | null; // pramostrar o título do filme

   @Column({ type: 'timestamptz', nullable: true }) readAt!: Date | null;

   @Column() dedupeKey!: string;
}
