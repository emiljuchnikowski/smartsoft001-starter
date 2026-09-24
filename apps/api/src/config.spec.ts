import { apiConfig } from './config';

describe('apiConfig', () => {
  it('should return the documented defaults when the environment is empty', () => {
    const result = apiConfig({});

    expect(result).toEqual({
      port: 3000,
      mongo: { host: 'localhost', port: 27017, database: 'example-app' },
      jwt: { secret: 'change-me', expiresIn: 3600 },
      clientId: 'example-app',
      admin: { username: 'admin@example.com', password: 'change-me' },
    });
  });

  it('should let every variable override its default', () => {
    const result = apiConfig({
      PORT: '4000',
      MONGO_HOST: 'mongo',
      MONGO_PORT: '27018',
      MONGO_DATABASE: 'other-app',
      JWT_SECRET: 'other-secret',
      JWT_EXPIRES_IN: '60',
      AUTH_CLIENT_ID: 'other-client',
      ADMIN_USERNAME: 'owner@example.com',
      ADMIN_PASSWORD: 'other-password',
    });

    expect(result).toEqual({
      port: 4000,
      mongo: { host: 'mongo', port: 27018, database: 'other-app' },
      jwt: { secret: 'other-secret', expiresIn: 60 },
      clientId: 'other-client',
      admin: { username: 'owner@example.com', password: 'other-password' },
    });
  });

  it('should treat an empty variable as unset', () => {
    const result = apiConfig({
      PORT: '',
      MONGO_HOST: '',
      MONGO_PORT: '',
      MONGO_DATABASE: '',
      JWT_SECRET: '',
      JWT_EXPIRES_IN: '',
      AUTH_CLIENT_ID: '',
      ADMIN_USERNAME: '',
      ADMIN_PASSWORD: '',
    });

    expect(result).toEqual(apiConfig({}));
  });

  it('should parse the numeric variables as numbers', () => {
    const result = apiConfig({
      PORT: '4000',
      MONGO_PORT: '27018',
      JWT_EXPIRES_IN: '60',
    });

    expect(typeof result.port).toBe('number');
    expect(typeof result.mongo.port).toBe('number');
    expect(typeof result.jwt.expiresIn).toBe('number');
  });
});
