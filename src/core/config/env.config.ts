import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { NodeEnvEnum } from '@/types/enum';

dotenv.config();

const envSchema = z.object({
  // Application envs
  NODE_ENV: z.enum(NodeEnvEnum).default(NodeEnvEnum.LOCAL),
  PORT: z.string().default('3000'),
  APP_VERSION: z.string().default('0.0.0'),
  API_ACCESS_KEY: z.string().optional(),
  FRONTEND_URL: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((url) => url.trim()))
    .refine((urls) => urls.every((url) => url.length > 0), {
      message: 'FRONTEND_URL cannot contain empty values',
    }),

  // jwt envs
  JWT_SECRET: z.string().default('super-secret-key-change-me'),
  JWT_EXPIRY: z.string().default('24h'),

  //database connection
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_DATABASE: z.string().optional(),

  //Google-OAuth credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Transactional Email (Brevo / Resend)
  BREVO_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('onboarding@resend.dev'),
});

type EnvType = z.infer<typeof envSchema>;

@Injectable()
export class EnvConfig {
  private readonly envConfig: EnvType;

  constructor() {
    const parsedEnv = envSchema.safeParse(process.env);

    if (!parsedEnv.success) {
      console.error('❌ Environment validation failed:', parsedEnv.error.format());
      throw new Error('Invalid environment configuration');
    }

    this.envConfig = parsedEnv.data;
  }

  get dbConfig() {
    if (!this.envConfig) {
      throw new Error('Environment not initialized');
    }

    const {
      DATABASE_URL,
      DB_HOST,
      DB_PORT,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
    } = this.envConfig;

    return {
      dburl: DATABASE_URL,
      host: DB_HOST,
      port: DB_PORT ? parseInt(DB_PORT, 10) : undefined,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_DATABASE,
    };
  }

  get googleOAuthConfig() {
    if (!this.envConfig) {
      throw new Error('Environment not initialized');
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_SECRET, GOOGLE_CALLBACK_URL } = this.envConfig;
    return {
      clientID: GOOGLE_CLIENT_ID,
      secret: GOOGLE_SECRET,
      callbackUrl: GOOGLE_CALLBACK_URL,
    };
  }

  get jwtConfig() {
    if (!this.envConfig) {
      throw new Error('Environment not initialized');
    }

    const { JWT_SECRET, JWT_EXPIRY } = this.envConfig;
    return {
      jwtSecret: JWT_SECRET,
      jwtExpiry: JWT_EXPIRY,
    };
  }

  get appConfig() {
    if (!this.envConfig) {
      throw new Error('Environment variable not initialized');
    }

    const { NODE_ENV, PORT, FRONTEND_URL } = this.envConfig;
    return {
      nodeEnv: NODE_ENV,
      port: PORT,
      frontendUrl: FRONTEND_URL, // returns string[]
      primaryFrontendUrl: FRONTEND_URL[0] || 'http://localhost:3000',
      isLocal: NODE_ENV === NodeEnvEnum.LOCAL,
      isProduction: NODE_ENV === NodeEnvEnum.PROD,
      isDevelopment: NODE_ENV === NodeEnvEnum.DEV,
      isStaging: NODE_ENV === NodeEnvEnum.STAGING,
    };
  }

  get brevoConfig() {
    if (!this.envConfig) {
      throw new Error('Environment not initialized');
    }

    const { BREVO_API_KEY, EMAIL_FROM } = this.envConfig;
    return {
      apiKey: BREVO_API_KEY,
      emailFrom: EMAIL_FROM,
    };
  }

  get resendConfig() {
    if (!this.envConfig) {
      throw new Error('Environment not initialized');
    }

    const { RESEND_API_KEY, EMAIL_FROM } = this.envConfig;
    return {
      apiKey: RESEND_API_KEY,
      emailFrom: EMAIL_FROM,
    };
  }
}
