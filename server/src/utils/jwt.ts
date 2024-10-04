import Jwt from 'jsonwebtoken';
import config from '../config/config';

interface Data {
  email: string;
}
const {
  algorithm,
  allow_renew,
  cache_prefix,
  access_key,
  refresh_key,
  access_expiration,
  refesh_expiration,
  renew_threshold,
} = config.jwt;

const { JWT_REFRESH_SECRET } = config.env;

export async function generateAccessToken(
  data: string | Data | Buffer,
  expiresIn = access_expiration,
): Promise<string> {
  const secretKey: Jwt.Secret = access_key;
  const options: Jwt.SignOptions = { expiresIn, algorithm };
  const token: string = Jwt.sign({ email: data }, secretKey, options);
  return token;
}

export function generateRefreshToken(
  data: string | Data | Buffer,
  expiresIn = refesh_expiration,
): string {
  const secretKey: Jwt.Secret = refresh_key;
  const options: Jwt.SignOptions = { expiresIn, algorithm };
  const token: string = Jwt.sign({ email: data }, secretKey, options);
  return token;
}

export function verifyRefreshToken(refreshToken: string) {
  if (JWT_REFRESH_SECRET) {
    const decoded = Jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET,
    ) as Jwt.JwtPayload;
    return decoded;
  }
}
