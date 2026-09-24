/** Nest injection token the API configuration is provided under. */
export const API_CONFIG = 'API_CONFIG';

export interface ApiConfig {
  port: number;
  mongo: { host: string; port: number; database: string };
  jwt: { secret: string; expiresIn: number };
  clientId: string;
  admin: { username: string; password: string };
}

/** An unset and an empty variable both fall back to the default. */
function text(value: string | undefined, fallback: string): string {
  return value ? value : fallback;
}

function number(value: string | undefined, fallback: number): number {
  return value ? Number(value) : fallback;
}

/** Reads the API configuration from the environment, with the defaults documented in .env.example. */
export function apiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: number(env.PORT, 3000),
    mongo: {
      host: text(env.MONGO_HOST, 'localhost'),
      port: number(env.MONGO_PORT, 27017),
      database: text(env.MONGO_DATABASE, 'example-app'),
    },
    jwt: {
      secret: text(env.JWT_SECRET, 'change-me'),
      expiresIn: number(env.JWT_EXPIRES_IN, 3600),
    },
    clientId: text(env.AUTH_CLIENT_ID, 'example-app'),
    admin: {
      username: text(env.ADMIN_USERNAME, 'admin@example.com'),
      password: text(env.ADMIN_PASSWORD, 'change-me'),
    },
  };
}
