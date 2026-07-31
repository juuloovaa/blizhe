import { Module, forwardRef } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { AuthGuard } from './auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [TelegramAuthService, AuthGuard],
  exports: [TelegramAuthService, AuthGuard],
})
export class AuthModule {}
