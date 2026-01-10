import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { RolesGuard } from './guards/roles..guard';

@Module({
  imports: [UsersModule],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
