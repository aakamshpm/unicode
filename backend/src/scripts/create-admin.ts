import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import prompts = require('prompts');
import * as bcrypt from 'bcrypt';

interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password based on environment
 * Dev: Minimum 8 characters
 * Prod: 8+ chars, uppercase, lowercase, number, special character
 */
function validatePassword(password: string): PasswordValidationResult {
  const isDev = process.env.NODE_ENV === 'development';

  // Minimum length check (both dev and prod)
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  // Additional checks for production
  if (!isDev) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (!hasLowercase) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (!hasNumber) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (!hasSpecial) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate email format using regex
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric, hyphens, underscores only
 * - No spaces
 */
function validateUsername(username: string): PasswordValidationResult {
  if (username.length < 3 || username.length > 20) {
    return {
      valid: false,
      error: 'Username must be 3-20 characters long',
    };
  }

  const usernameRegex = /^[a-z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error:
        'Username can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
}

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log('\nAdmin Account Creation\n');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);

    // Step 1: Prompt for email
    const emailPrompt = await prompts({
      type: 'text',
      name: 'email',
      message: 'Enter admin email:',
      validate: (value) =>
        validateEmail(value) ? true : 'Invalid email format',
    });

    if (!emailPrompt.email) {
      console.log('\nAdmin creation cancelled\n');
      await app.close();
      return;
    }

    const email = emailPrompt.email.trim().toLowerCase();

    // Step 2: Check if admin already exists
    const existingUser = await usersService.findByEmail(email);
    if (existingUser) {
      console.error(`\nError: User with email "${email}" already exists\n`);
      await app.close();
      process.exit(1);
    }

    // Step 3: Prompt for username
    const usernamePrompt = await prompts({
      type: 'text',
      name: 'username',
      message: 'Enter admin username:',
      validate: (value) => {
        const trimmed = value.trim().toLowerCase();
        const result = validateUsername(trimmed);
        return result.valid ? true : result.error!;
      },
    });

    if (!usernamePrompt.username) {
      console.log('\nAdmin creation cancelled\n');
      await app.close();
      return;
    }

    const username = usernamePrompt.username.trim().toLowerCase();

    // Step 4: Check if username is taken
    const existingUsername = await usersService.findByUsername(username);
    if (existingUsername) {
      console.error(
        `\nError: Username "${username}" is already taken. Please choose a different username.\n`,
      );
      await app.close();
      process.exit(1);
    }

    // Step 5: Prompt for password (hidden input)
    const passwordPrompt = await prompts({
      type: 'password',
      name: 'password',
      message: 'Enter admin password:',
      validate: (value) => {
        const result = validatePassword(value);
        return result.valid ? true : result.error!;
      },
    });

    if (!passwordPrompt.password) {
      console.log('\nAdmin creation cancelled\n');
      await app.close();
      return;
    }

    // Step 6: Confirm password
    const confirmPrompt = await prompts({
      type: 'password',
      name: 'confirm',
      message: 'Confirm password:',
      validate: (value) =>
        value === passwordPrompt.password ? true : 'Passwords do not match',
    });

    if (!confirmPrompt.confirm) {
      console.log('\nAdmin creation cancelled\n');
      await app.close();
      return;
    }

    // Step 7: Hash password with bcrypt
    console.log('\nHashing password...');
    const saltRounds = 10;
    let password_hash: string;

    try {
      password_hash = await bcrypt.hash(passwordPrompt.password, saltRounds);
    } catch (error) {
      console.error('\nError hashing password:', error.message);
      await app.close();
      process.exit(1);
    }

    // Step 8: Create admin account
    console.log('Creating admin account...\n');

    const admin = await usersService.createAdmin({
      email,
      username,
      password_hash,
    });

    console.log('Admin account created successfully!\n');
    console.log('Email:', admin.email);
    console.log('Username:', admin.username);
    console.log('Role:', admin.role.name);
    console.log('User ID:', admin.id);
    console.log('\nKeep these credentials secure!\n');
  } catch (error) {
    console.error('\nError creating admin:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

createAdmin();
