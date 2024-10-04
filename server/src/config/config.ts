import dotenv from 'dotenv';
import { ConfigModel, EnvironmentModel } from './configModel';
dotenv.config();

const env = JSON.parse(JSON.stringify(process.env)) as EnvironmentModel;

// All Configs that needed to be centralized
const config: ConfigModel = {
  // JWT Configuration
  jwt: {
    access_key: env.JWT_SECRET || 'abcddd!@#11231',
    refresh_key: env.JWT_REFRESH_SECRET || 'abcddd!@#test123',
    access_expiration: '10m', // milliseconds (e.g.: 60, "2 days", "10h", "7d")
    refesh_expiration: '15d', // milliseconds (e.g.: 60, "2 days", "10h", "7d")
    algorithm: 'HS256', // (default: HS256)
    cache_prefix: 'token:',
    allow_renew: true,
    renew_threshold: 2 * 60 * 1000,
  },
  env,
};

export default config;
