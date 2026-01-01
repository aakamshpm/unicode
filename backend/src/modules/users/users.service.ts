import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByUsername(createUserDto.username);

    if (existingUser) throw new ConflictException('Username already taken');

    // Get default 'user' role id from db by checking its existence with role name
    const userRole = await this.findRoleByName('user');
    if (!userRole)
      throw new NotFoundException(
        'Default user role not found. run seed script',
      );

    const user = this.userRepository.create({
      ...createUserDto,
      role: userRole,
    });
    return this.userRepository.save(user);
  }

  /* Create a new admin user (Email/Password)
   Used by CLI script only */
  async createAdmin(adminData: {
    email: string;
    password_hash: string;
    username: string;
  }): Promise<User> {
    const existingUser = await this.findByEmail(adminData.email);

    if (existingUser)
      throw new ConflictException('User with this email alrady exists');

    // Get default 'admin' role id from db by checking its existence with role name
    const adminRole = await this.findRoleByName('admin');
    if (!adminRole)
      throw new NotFoundException('Admin role not found. Run seed script');

    const admin = this.userRepository.create({
      email: adminData.email,
      username: adminData.username,
      password_hash: adminData.password_hash,
      auth_provider: 'email',
      role: adminRole,
    });
    return this.userRepository.save(admin);
  }

  /**
   * Find user by email WITH password hash (for authentication)
   * SECURITY: password_hash has select: false by default
   * @param email - User's email address
   * @returns User with password_hash or null if not found
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email })
      .getOne();
  }

  /* Helper Functions */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { last_login_at: new Date() });
  }
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return !user;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}
