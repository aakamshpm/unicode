import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
// Verifies JWT with the jwt.statergy file and assigns appropriate id with req is a user is validated
