import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env file
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const isLocal = dbUrl?.includes('localhost') || dbUrl?.includes('127.0.0.1');

export const AppDataSource = new DataSource(
  dbUrl
    ? {
        type: 'postgres',
        url: dbUrl,
        entities: [path.join(__dirname, 'entities', '*.entity.{ts,js}')],
        migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: false,
        ssl: isLocal ? false : { rejectUnauthorized: false },
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [path.join(__dirname, 'entities', '*.entity.{ts,js}')],
        migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: false,
        ssl: false,
      }
);
