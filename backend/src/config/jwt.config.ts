import { registerAs } from '@nestjs/config';

export interface JwtTokenConfig {
  secret: string;
  expiresIn: string;
}

export interface JwtConfig {
  accessToken: JwtTokenConfig;
  refreshToken: JwtTokenConfig;
}

export const JWT_CONFIG_KEY = 'jwt';

export default registerAs(JWT_CONFIG_KEY, (): JwtConfig => {
  const {
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRATION,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRATION,
  } = process.env;

  if (!JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not set');
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set');

  return {
    accessToken: {
      secret: JWT_ACCESS_SECRET,
      expiresIn: JWT_ACCESS_EXPIRATION || '15m',
    },
    refreshToken: {
      secret: JWT_REFRESH_SECRET,
      expiresIn: JWT_REFRESH_EXPIRATION || '7d',
    },
  };
});
