import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TestsService } from './tests.service';
import { AuthUser } from '../types/models';

class StartDto {
  @IsString()
  slug!: string;
}

class AnswerDto {
  @IsString()
  questionId!: string;

  @IsString()
  optionId!: string;
}

@Controller('tests')
@UseGuards(AuthGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  list() {
    return this.testsService.list();
  }

  @Post('start')
  start(@CurrentUser() user: AuthUser, @Body() dto: StartDto) {
    return this.testsService.start(user.id, dto.slug);
  }

  @Get('sessions/:id')
  session(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.testsService.getSession(user.id, id);
  }

  @Post('sessions/:id/answer')
  answer(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AnswerDto) {
    return this.testsService.answer(user.id, id, dto);
  }

  @Post('sessions/:id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.testsService.complete(user.id, id);
  }

  @Get('by/:slug')
  get(@Param('slug') slug: string) {
    return this.testsService.getBySlug(slug);
  }
}
