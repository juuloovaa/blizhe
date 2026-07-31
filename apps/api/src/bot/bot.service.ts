import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import type { Update } from 'grammy/types';
import { PrismaService } from '../prisma/prisma.service';

type NotifyKind =
  | 'moodNotes'
  | 'testInvites'
  | 'testPartnerDone'
  | 'dailyQuestion'
  | 'partnerCard';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot?: Bot;
  private polling = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get isServerless() {
    return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  }

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token.includes('ABC-DEF')) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
      return;
    }

    this.bot = new Bot(token);
    this.registerHandlers();
    this.bot.catch((err) => this.logger.error(err));

    // Polling only for long-running servers. On Vercel use webhook.
    if (!this.isServerless) {
      this.polling = true;
      void this.bot.start({
        onStart: () => this.logger.log('Telegram bot polling started'),
      });
    } else {
      this.logger.log('Serverless mode: bot ready for webhook + notify API');
    }
  }

  async onModuleDestroy() {
    if (this.polling) {
      await this.bot?.stop();
    }
  }

  private registerHandlers() {
    if (!this.bot) return;
    const webAppUrl = this.config.get<string>('WEBAPP_URL') || 'http://localhost:5173';

    this.bot.command('start', async (ctx) => {
      const payload = ctx.match?.toString() || '';
      const keyboard = new InlineKeyboard().webApp(
        'Открыть приложение',
        this.withStartParam(webAppUrl, payload),
      );

      if (payload.startsWith('invite_')) {
        await ctx.reply(
          'Вас пригласили в пару в «Ближе». Откройте приложение, чтобы подтвердить соединение.',
          { reply_markup: keyboard },
        );
        return;
      }

      const replyKeyboard = new Keyboard()
        .webApp('Открыть приложение', webAppUrl)
        .resized()
        .persistent();

      await ctx.reply(
        'Добро пожаловать в «Ближе» — пространство для близости, чувств и саморефлексии.\n\nНажмите кнопку ниже, чтобы открыть приложение.',
        { reply_markup: replyKeyboard },
      );
      await ctx.reply('Или откройте Mini App здесь:', { reply_markup: keyboard });
    });
  }

  async handleUpdate(update: Update) {
    if (!this.bot) return;
    await this.bot.handleUpdate(update);
  }

  async ensureWebhook(publicBaseUrl: string) {
    if (!this.bot) return null;
    const url = `${publicBaseUrl.replace(/\/$/, '')}/api/bot/webhook`;
    await this.bot.api.setWebhook(url);
    return url;
  }

  private withStartParam(url: string, payload: string) {
    if (!payload) return url;
    const u = new URL(url);
    u.searchParams.set('tgWebAppStartParam', payload);
    if (payload.startsWith('invite_')) {
      u.searchParams.set('invite', payload.replace(/^invite_/, ''));
    }
    return u.toString();
  }

  async notifyUser(
    telegramId: bigint,
    text: string,
    path = '/',
    kind?: NotifyKind,
    userId?: string,
  ) {
    if (!this.bot) return;

    if (kind && userId) {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { userId },
      });
      if (settings && settings[kind] === false) return;
    }

    const webAppUrl = this.config.get<string>('WEBAPP_URL') || 'http://localhost:5173';
    const url = new URL(webAppUrl);
    const base = `${url.origin}${url.pathname}`.replace(/\/$/, '');
    const appUrl = `${base}/#${path}`;
    const keyboard = new InlineKeyboard().webApp('Открыть', appUrl);

    try {
      await this.bot.api.sendMessage(telegramId.toString(), text, {
        reply_markup: keyboard,
      });
    } catch (e) {
      this.logger.warn(`Failed to notify ${telegramId}: ${String(e)}`);
    }
  }
}
