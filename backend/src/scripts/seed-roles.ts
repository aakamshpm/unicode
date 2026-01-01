import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';

/**
 * Seed script for creating initial roles
 * Usage: npm run seed:roles
 *
 * Creates two roles:
 * 1. 'user' - Regular users who can solve problems
 * 2. 'admin' - Admins who can create/edit/delete problems
 
 * Seed Flow:
    npm run seed:roles
         ↓
    Create NestJS context
         ↓
    Inject UsersService
         ↓
    Check if roles exist
         ↓
    If not found → Create 'user' role
         ↓
    If not found → Create 'admin' role
         ↓
    Display results
         ↓
    Close app gracefully
 */
async function seedRoles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log('\nSeeding roles...\n');

    // Check if roles already exist
    const existingUserRole = await usersService.findRoleByName('user');
    const existingAdminRole = await usersService.findRoleByName('admin');

    if (existingUserRole && existingAdminRole) {
      console.log('Roles already exist. Skipping seed.');
      console.log('   - user role: ', existingUserRole.id);
      console.log('   - admin role: ', existingAdminRole.id);
      await app.close();
      return;
    }

    // Create 'user' role
    if (!existingUserRole) {
      const userRole = await usersService.createRole(
        'user',
        'Regular user - can solve problems and participate in contests',
      );
      console.log('Created "user" role:', userRole.id);
    } else {
      console.log('⏭"user" role already exists');
    }

    // Create 'admin' role
    if (!existingAdminRole) {
      const adminRole = await usersService.createRole(
        'admin',
        'Admin - can create, edit, and delete problems',
      );
      console.log('Created "admin" role:', adminRole.id);
    } else {
      console.log('"admin" role already exists');
    }

    console.log('\nRole seeding completed successfully!\n');
  } catch (error) {
    console.error('\nError seeding roles:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedRoles();
