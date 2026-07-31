import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AssistantService } from './assistant.service';

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
  history(@CurrentUser() user: User) {
    return this.assistantService.history(user.id);
  }

  @Post()
  send(@CurrentUser() user: User, @Body() dto: SendDto) {
    return this.assistantService.send(user.id, dto.content);
  }
}
