import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserMode } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

class OnboardingDto {
  @IsEnum(UserMode)
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
  @IsEnum(UserMode)
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
  me(@CurrentUser() user: User) {
    return this.usersService.getMe(user.id);
  }

  @Post('onboarding')
  onboarding(@CurrentUser() user: User, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto);
  }

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('notifications')
  notifications(@CurrentUser() user: User, @Body() dto: NotificationSettingsDto) {
    return this.usersService.updateNotificationSettings(user.id, dto);
  }

  @Delete()
  delete(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
