import { Global, Module } from '@nestjs/common';
import { EnvConfig } from './env.config';

@Global()
@Module({
  providers: [EnvConfig],
  exports: [EnvConfig],
})
export class ConfigModule {}
