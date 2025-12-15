import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { OAuthConfig } from '../../../config/oauth.config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const oauthConfig = configService.get<OAuthConfig>('oauth')!;

    super({
      clientID: oauthConfig.github.clientId,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: oauthConfig.github.callbackUrl,
      scope: ['user:email'],
    });
  }

  async validate() {}
}
