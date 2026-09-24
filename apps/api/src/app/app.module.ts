import { Module } from '@nestjs/common';
import { APP_FILTER, RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ENTITIES } from '@smartsoft001/auth-domain';
import { AuthShellNestjsModule } from '@smartsoft001/auth-shell-nestjs';
import { CrudShellNestjsModule } from '@smartsoft001/crud-shell-nestjs';
import { AppExceptionFilter } from '@smartsoft001/nestjs';

import { Note } from '@app/model';

import { UsersSeed } from './users.seed';
import { API_CONFIG, apiConfig } from '../config';

const config = apiConfig();

// The JWT settings are shared by the module that issues tokens (auth) and the
// module that checks them on every CRUD route.
const tokenConfig = {
  secretOrPrivateKey: config.jwt.secret,
  expiredIn: config.jwt.expiresIn,
};

@Module({
  imports: [
    // `AuthShellNestjsModule` stores users through TypeORM and expects the
    // root connection to be registered by the application.
    TypeOrmModule.forRoot({
      type: 'mongodb',
      host: config.mongo.host,
      port: config.mongo.port,
      database: config.mongo.database,
      entities: ENTITIES,
    }),
    TypeOrmModule.forFeature(ENTITIES),

    // POST /api/token: the OAuth password grant for the seeded user.
    AuthShellNestjsModule.forRoot({
      tokenConfig: { ...tokenConfig, clients: [config.clientId] },
    }),

    // The generic CRUD controller for one entity, backed by MongoDB. Its routes
    // are registered at the module root, so `RouterModule` mounts them under
    // /api/notes.
    CrudShellNestjsModule.forRoot({
      tokenConfig,
      permissions: {
        create: ['admin'],
        read: ['admin', 'user'],
        update: ['admin'],
        delete: ['admin'],
      },
      db: {
        host: config.mongo.host,
        port: config.mongo.port,
        database: config.mongo.database,
        collection: 'notes',
        type: Note,
      },
      restApi: true,
      socket: false,
    }),
    RouterModule.register([{ path: 'notes', module: CrudShellNestjsModule }]),
  ],
  providers: [
    { provide: API_CONFIG, useValue: config },
    UsersSeed,
    // Maps DomainValidationError / DomainForbiddenError to 400 / 403.
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
