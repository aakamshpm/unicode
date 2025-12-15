import { registerAs } from '@nestjs/config';

export interface OAuthConfig {
  github: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export const OAUTH_CONFIG_KEY = 'oauth';

export default registerAs(OAUTH_CONFIG_KEY, (): OAuthConfig => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } =
    process.env;

  if (!GITHUB_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID is not set');
  if (!GITHUB_CLIENT_SECRET) throw new Error('GITHUB_CLIENT_SECRET is not set');
  if (!GITHUB_CALLBACK_URL) throw new Error('GITHUB_CALLBACK_URL is not set');

  return {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackUrl: GITHUB_CALLBACK_URL,
    },
  };
});
