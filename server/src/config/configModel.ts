import { Algorithm } from 'jsonwebtoken';

export interface JwtModel {
  readonly access_key: string;
  readonly refresh_key: string;
  readonly access_expiration: number | string;
  readonly refesh_expiration: number | string;
  readonly algorithm: Algorithm;
  readonly cache_prefix: string;
  readonly allow_renew: boolean;
  readonly renew_threshold: number;
}

export interface EnvironmentModel {
  readonly NODE_ENV: string;
  readonly PORT: number;
  readonly JWT_SECRET?: string;
  readonly JWT_REFRESH_SECRET?: string;
  readonly COOKIE_DOMAIN?: string;
  readonly URL?: string;
  readonly INSTRUMENTATION_KEY?: string;
  readonly AZURE_STORAGE_ACCOUNT_NAME?: string;
  readonly AZURE_STORAGE_ACCOUNT_KEY?: string;
  readonly MAIL_ID?: string;
  readonly MAIL_PASSWORD?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly GOOGLE_REDIRECT_URI?: string;
}

export interface ConfigModel {
  readonly jwt: JwtModel;
  readonly env: EnvironmentModel;
}
