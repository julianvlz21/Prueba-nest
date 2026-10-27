import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from '../seed/seed.service.js';

/** `npm run seed`: same idempotent logic as the POST /seed endpoints. */
const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
const { created } = await app.get(SeedService).seedAll();
console.log(created.length ? created.map((item) => `+ ${item}`).join('\n') : '= no hay nada nuevo que crear');
await app.close();
