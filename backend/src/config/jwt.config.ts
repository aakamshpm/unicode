import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const JWT_CONFIG_KEY = 'jwt';

export default registerAs(JWT_CONFIG_KEY, (): JwtConfig => {
  const { JWT_SECRET, JWT_EXPIRATION } = process.env;

  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  if (!JWT_EXPIRATION) throw new Error('JWT_EXPIRATION is not set');

  return {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRATION,
  };
});
