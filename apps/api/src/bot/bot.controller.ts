import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Update } from 'grammy/types';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(
    private readonly botService: BotService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  async webhook(
    @Body() update: Update,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    await this.botService.handleUpdate(update);
    return { ok: true };
  }

  /** One-time helper to register webhook after deploy */
  @Post('setup-webhook')
  async setupWebhook(@Headers('x-setup-secret') setupSecret?: string) {
    const expected = this.config.get<string>('SETUP_SECRET') || this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && setupSecret !== expected) {
      throw new UnauthorizedException('Invalid setup secret');
    }
    const base =
      this.config.get<string>('WEBAPP_URL') ||
      this.config.get<string>('VERCEL_PROJECT_PRODUCTION_URL') ||
      '';
    if (!base) {
      return { ok: false, error: 'WEBAPP_URL is not set' };
    }
    const url = await this.botService.ensureWebhook(base.startsWith('http') ? base : `https://${base}`);
    return { ok: true, url };
  }
}
