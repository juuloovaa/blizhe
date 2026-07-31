import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';
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

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token.includes('ABC-DEF')) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — bot polling disabled');
      return;
    }

    this.bot = new Bot(token);
    const webAppUrl = this.config.get<string>('WEBAPP_URL') || 'http://localhost:5173';

    this.bot.command('start', async (ctx) => {
      const payload = ctx.match?.toString() || '';
      const keyboard = new InlineKeyboard().webApp('Открыть приложение', this.withStartParam(webAppUrl, payload));

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

    this.bot.catch((err) => this.logger.error(err));
    void this.bot.start({
      onStart: () => this.logger.log('Telegram bot started'),
    });
  }

  async onModuleDestroy() {
    await this.bot?.stop();
  }

  private withStartParam(url: string, payload: string) {
    if (!payload) return url;
    const u = new URL(url);
    u.searchParams.set('tgWebAppStartParam', payload);
    // Also support our own query for browser/dev
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
    // path as hash route
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
