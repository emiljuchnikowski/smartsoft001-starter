import { MongoRepository } from 'typeorm';

import { User } from '@smartsoft001/auth-domain';
import { PasswordService } from '@smartsoft001/utils';

import { ApiConfig } from '../config';
import { UsersSeed } from './users.seed';

const adminPassword = 'seed-password';

const config: ApiConfig = {
  port: 3000,
  mongo: { host: 'localhost', port: 27017, database: 'example-app' },
  jwt: { secret: 'change-me', expiresIn: 3600 },
  clientId: 'example-app',
  admin: { username: 'admin@example.com', password: adminPassword },
};

function createRepository() {
  return { findOneBy: jest.fn(), insertOne: jest.fn() };
}

describe('UsersSeed', () => {
  it('should insert the admin user when it is missing', async () => {
    const repository = createRepository();
    repository.findOneBy.mockResolvedValue(null);
    const seed = new UsersSeed(
      repository as unknown as MongoRepository<User>,
      config,
    );

    const result = await seed.seed();

    expect(result).toBe(true);
    expect(repository.insertOne).toHaveBeenCalledTimes(1);
    const user: User = repository.insertOne.mock.calls[0][0];
    expect(user.username).toBe(config.admin.username);
    expect(user.permissions).toEqual(['admin']);
    expect(user.disabled).toBe(false);
  });

  it('should store the admin password hashed', async () => {
    const repository = createRepository();
    repository.findOneBy.mockResolvedValue(null);
    const seed = new UsersSeed(
      repository as unknown as MongoRepository<User>,
      config,
    );

    await seed.seed();

    const user: User = repository.insertOne.mock.calls[0][0];
    expect(user.password).not.toBe(adminPassword);
    await expect(
      PasswordService.compare(adminPassword, user.password),
    ).resolves.toBe(true);
  });

  it('should not insert a user when the admin already exists', async () => {
    const repository = createRepository();
    repository.findOneBy.mockResolvedValue(new User());
    const seed = new UsersSeed(
      repository as unknown as MongoRepository<User>,
      config,
    );

    const result = await seed.seed();

    expect(result).toBe(false);
    expect(repository.insertOne).not.toHaveBeenCalled();
  });

  it('should seed on the application bootstrap', async () => {
    const repository = createRepository();
    repository.findOneBy.mockResolvedValue(null);
    const seed = new UsersSeed(
      repository as unknown as MongoRepository<User>,
      config,
    );

    await expect(seed.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(repository.insertOne).toHaveBeenCalledTimes(1);
  });

  it('should resolve the application bootstrap when the admin already exists', async () => {
    const repository = createRepository();
    repository.findOneBy.mockResolvedValue(new User());
    const seed = new UsersSeed(
      repository as unknown as MongoRepository<User>,
      config,
    );

    await expect(seed.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(repository.insertOne).not.toHaveBeenCalled();
  });
});
