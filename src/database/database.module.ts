import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvConfig } from '../core/config/env.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvConfig],
      useFactory: (envConfig: EnvConfig) => {
        const dbConfig = envConfig.dbConfig;
        if (dbConfig.dburl) {
          const isLocal = dbConfig.dburl.includes('localhost') || dbConfig.dburl.includes('127.0.0.1');
          return {
            type: 'postgres',
            url: dbConfig.dburl,
            autoLoadEntities: true,
            synchronize: false,
            ssl: isLocal ? false : { rejectUnauthorized: false },
          };
        } else {
          return {
            type: 'postgres',
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            autoLoadEntities: true,
            synchronize: false,
            ssl: false,
          };
        }
      },
    }),
  ],
})
export class DatabaseModule {}
