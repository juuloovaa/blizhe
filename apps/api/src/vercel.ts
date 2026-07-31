import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express, type Request, type Response } from 'express';
import { AppModule } from './app.module';

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function toJSON() {
  return this.toString();
};

let cachedApp: Express | undefined;

export async function createNestServer(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  // Vercel may pre-parse JSON; keep Express parsers for local/dev and edge cases.
  expressApp.use(express.json({ limit: '2mb' }));
  expressApp.use(express.urlencoded({ extended: true }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bodyParser: false,
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

/** Normalize Vercel/Node request body before Nest sees it */
export function ensureJsonBody(req: Request, _res: Response, next: () => void) {
  if (req.body == null || req.body === '') {
    req.body = {};
  } else if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // leave as-is; validation will fail clearly
    }
  }
  next();
}
