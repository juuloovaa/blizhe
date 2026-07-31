import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly telegramAuth: TelegramAuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData =
      (request.headers['x-telegram-init-data'] as string | undefined) ||
      (request.headers['authorization']?.replace(/^tma\s+/i, '') as string | undefined);

    if (!initData) {
      throw new UnauthorizedException('Telegram authorization required');
    }

    const validated = this.telegramAuth.validateInitData(initData);
    const user = await this.usersService.upsertFromTelegram(validated.user);

    request.user = user;
    request.telegram = validated;
    return true;
  }
}
