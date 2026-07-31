import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { AuthUser, UserMode } from '../types/models';

class OnboardingDto {
  @IsIn(['solo', 'couple'])
  mode!: UserMode;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  pronouns?: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  pronouns?: string | null;

  @IsOptional()
  @IsIn(['solo', 'couple'])
  mode?: UserMode;
}

class NotificationSettingsDto {
  @IsOptional() @IsBoolean() moodNotes?: boolean;
  @IsOptional() @IsBoolean() testInvites?: boolean;
  @IsOptional() @IsBoolean() testPartnerDone?: boolean;
  @IsOptional() @IsBoolean() dailyQuestion?: boolean;
  @IsOptional() @IsBoolean() partnerCard?: boolean;
}

@Controller('me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Post('onboarding')
  async onboarding(@CurrentUser() user: AuthUser, @Body() dto: OnboardingDto) {
    await this.usersService.completeOnboarding(user.id, dto);
    return this.usersService.getMe(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('notifications')
  notifications(@CurrentUser() user: AuthUser, @Body() dto: NotificationSettingsDto) {
    return this.usersService.updateNotificationSettings(user.id, dto);
  }

  @Delete()
  delete(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
