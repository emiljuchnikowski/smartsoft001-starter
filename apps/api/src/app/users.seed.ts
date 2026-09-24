import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';

import { User } from '@smartsoft001/auth-domain';
import { PasswordService } from '@smartsoft001/utils';

import { API_CONFIG, ApiConfig } from '../config';

/** Seeds the one user the example needs so that login works on the first start. */
@Injectable()
export class UsersSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeed.name);

  constructor(
    @InjectRepository(User) private readonly users: MongoRepository<User>,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const username = this.config.admin.username;
    const seeded = await this.seed();

    this.logger.log(
      seeded ? `Seeded user ${username}` : `User ${username} already exists`,
    );
  }

  /** Inserts the admin user when it is missing. Returns true when a user was inserted. */
  async seed(): Promise<boolean> {
    const username = this.config.admin.username;

    // `save` needs an `@ObjectIdColumn`, which the shipped `User` entity has not;
    // `insertOne` and `findOneBy` work without one.
    const existing = await this.users.findOneBy({ username });
    if (existing) {
      return false;
    }

    const user = new User();
    user.username = username;
    user.password = await PasswordService.hash(this.config.admin.password);
    user.permissions = ['admin'];
    user.disabled = false;

    await this.users.insertOne(user);

    return true;
  }
}
