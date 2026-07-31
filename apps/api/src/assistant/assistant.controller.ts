import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AssistantService } from './assistant.service';
import { AuthUser } from '../types/models';

class SendDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

@Controller('assistant')
@UseGuards(AuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get()
  history(@CurrentUser() user: AuthUser) {
    return this.assistantService.history(user.id);
  }

  @Post()
  send(@CurrentUser() user: AuthUser, @Body() dto: SendDto) {
    return this.assistantService.send(user.id, dto.content);
  }
}
