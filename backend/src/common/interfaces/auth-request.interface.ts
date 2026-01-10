import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
