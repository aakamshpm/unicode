import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';

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

  /**
   * Hashed password - only for email/password authentication
   * SECURITY: select: false prevents password from being queried by default
   * Must explicitly select this field when needed for validation
   */
  @Column({ nullable: true, select: false })
  password_hash: string | null;

  @Column({ type: 'enum', enum: ['github', 'email'], default: 'github' })
  auth_provider: 'github' | 'email';

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'int', default: 0 })
  easy_solved: number;

  @Column({ type: 'int', default: 0 })
  medium_solved: number;

  @Column({ type: 'int', default: 0 })
  hard_solved: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({
    name: 'role_id',
  })
  role: Role;

  @Column('uuid')
  role_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  last_login_at: Date;
  /**
   * Helper method to check if user has a specific role
   * @param roleName - Name of the role to check (e.g., 'admin')
   * @returns boolean
   */
  hasRole(roleName: string): boolean {
    return this.role?.name === roleName;
  }

  /**
   * Helper method to check if user is an admin
   * Admins can create/edit/delete problems but cannot solve them
   * @returns boolean
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Helper method to check if user is a regular user
   * Regular users can solve problems but cannot manage them
   * @returns boolean
   */
  isRegularUser(): boolean {
    return this.hasRole('user');
  }
}
