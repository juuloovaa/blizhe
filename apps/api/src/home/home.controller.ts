import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { HomeService } from './home.service';
import { AuthUser, DailyQuestionType, MoodType } from '../types/models';

class AnswerDto {
  @IsString()
  questionId!: string;

  @IsString()
  @MaxLength(1000)
  answerText!: string;

  @IsEnum(DailyQuestionType)
  type!: DailyQuestionType;
}

class MoodDto {
  @IsEnum(MoodType)
  mood!: MoodType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@Controller('home')
@UseGuards(AuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  home(@CurrentUser() user: AuthUser) {
    return this.homeService.getHome(user.id);
  }

  @Post('daily-answer')
  answer(@CurrentUser() user: AuthUser, @Body() dto: AnswerDto) {
    return this.homeService.answerDaily(user.id, dto);
  }

  @Post('mood')
  mood(@CurrentUser() user: AuthUser, @Body() dto: MoodDto) {
    return this.homeService.createMoodNote(user.id, dto.mood, dto.note);
  }

  @Post('mood/:id/read')
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.homeService.markMoodRead(user.id, id);
  }
}
