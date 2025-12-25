import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  display_name: string | null;

  @Column({ default: 'github' })
  oauth_provider: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'int', default: 0 })
  easy_solved: number;

  @Column({ type: 'int', default: 0 })
  medium_solved: number;

  @Column({ type: 'int', default: 0 })
  hard_solved: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  last_login_at: Date;
}
