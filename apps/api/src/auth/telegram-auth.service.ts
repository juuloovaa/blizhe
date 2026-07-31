import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type ValidatedInitData = {
  user: TelegramWebAppUser;
  authDate: number;
  startParam?: string;
  queryId?: string;
};

@Injectable()
export class TelegramAuthService {
  constructor(private readonly config: ConfigService) {}

  validateInitData(initData: string): ValidatedInitData {
    if (!initData) {
      throw new UnauthorizedException('Missing Telegram initData');
    }

    const allowDev = this.config.get<string>('ALLOW_DEV_AUTH') === 'true';
    if (allowDev && initData.startsWith('dev:')) {
      return this.parseDevAuth(initData);
    }

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Bot token is not configured');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      throw new UnauthorizedException('Invalid initData: missing hash');
    }

    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const hashBuffer = Buffer.from(hash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      throw new UnauthorizedException('Invalid initData signature');
    }

    const authDate = Number(params.get('auth_date') ?? 0);
    const maxAgeSec = 24 * 60 * 60;
    if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) {
      throw new UnauthorizedException('initData expired');
    }

    const userRaw = params.get('user');
    if (!userRaw) {
      throw new UnauthorizedException('Invalid initData: missing user');
    }

    let user: TelegramWebAppUser;
    try {
      user = JSON.parse(userRaw) as TelegramWebAppUser;
    } catch {
      throw new UnauthorizedException('Invalid initData: bad user payload');
    }

    if (!user?.id) {
      throw new UnauthorizedException('Invalid initData: user id missing');
    }

    return {
      user,
      authDate,
      startParam: params.get('start_param') ?? undefined,
      queryId: params.get('query_id') ?? undefined,
    };
  }

  private parseDevAuth(initData: string): ValidatedInitData {
    // Format: dev:<telegramId>:<displayName>
    const parts = initData.split(':');
    const id = Number(parts[1] || 1001);
    const name = parts[2] || 'Dev User';
    return {
      user: {
        id,
        first_name: name,
        username: `dev_${id}`,
        photo_url: undefined,
      },
      authDate: Math.floor(Date.now() / 1000),
      startParam: parts[3],
    };
  }

  /** Utility kept for potential WebApp data validation helpers */
  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
}
