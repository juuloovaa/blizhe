import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TestsService } from './tests.service';

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
  start(@CurrentUser() user: User, @Body() dto: StartDto) {
    return this.testsService.start(user.id, dto.slug);
  }

  @Get('sessions/:id')
  session(@CurrentUser() user: User, @Param('id') id: string) {
    return this.testsService.getSession(user.id, id);
  }

  @Post('sessions/:id/answer')
  answer(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AnswerDto) {
    return this.testsService.answer(user.id, id, dto);
  }

  @Post('sessions/:id/complete')
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.testsService.complete(user.id, id);
  }

  @Get('by/:slug')
  get(@Param('slug') slug: string) {
    return this.testsService.getBySlug(slug);
  }
}
