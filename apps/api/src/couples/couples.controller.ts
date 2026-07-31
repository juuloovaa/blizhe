import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CouplesService } from './couples.service';
import { AuthUser } from '../types/models';

class AcceptInviteDto {
  @IsString()
  code!: string;
}

class CancelInviteDto {
  @IsOptional()
  @IsString()
  code?: string;
}

@Controller('couple')
@UseGuards(AuthGuard)
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Get()
  async status(@CurrentUser() user: AuthUser) {
    const membership = await this.couplesService.getActiveMembership(user.id);
    const pendingInvite = await this.couplesService.getPendingInvite(user.id);
    if (!membership) {
      return { couple: null, pendingInvite };
    }
    const partner = membership.couple.members.find((m) => m.userId !== user.id)?.user;
    return {
      couple: {
        id: membership.couple.id,
        partner: partner
          ? {
              id: partner.id,
              displayName: partner.displayName,
              photoUrl: partner.photoUrl,
              pronouns: partner.pronouns,
            }
          : null,
      },
      pendingInvite,
    };
  }

  @Post('invite')
  createInvite(@CurrentUser() user: AuthUser) {
    return this.couplesService.createInvite(user.id);
  }

  @Post('invite/cancel')
  cancelInvite(@CurrentUser() user: AuthUser, @Body() dto: CancelInviteDto) {
    return this.couplesService.cancelInvite(user.id, dto.code);
  }

  @Get('invite/:code')
  preview(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.couplesService.previewInvite(user.id, code);
  }

  @Post('invite/accept')
  accept(@CurrentUser() user: AuthUser, @Body() dto: AcceptInviteDto) {
    return this.couplesService.acceptInvite(user.id, dto.code);
  }

  @Post('disconnect')
  disconnect(@CurrentUser() user: AuthUser) {
    return this.couplesService.disconnect(user.id);
  }

  @Post('block')
  block(@CurrentUser() user: AuthUser) {
    return this.couplesService.blockPartner(user.id);
  }

  @Delete('data')
  deleteData(@CurrentUser() user: AuthUser) {
    return this.couplesService.deleteCoupleData(user.id);
  }
}
