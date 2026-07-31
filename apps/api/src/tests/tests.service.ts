import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouplesService } from '../couples/couples.service';
import { BotService } from '../bot/bot.service';

type Option = { id: string; label: string; scoreKey?: string };

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couples: CouplesService,
    private readonly bot: BotService,
  ) {}

  list() {
    return this.prisma.test.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        topic: true,
        _count: { select: { questions: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const test = await this.prisma.test.findUnique({
      where: { slug },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!test || !test.active) throw new NotFoundException('Тест не найден');
    return test;
  }

  async start(userId: string, slug: string) {
    const test = await this.getBySlug(slug);
    const partner = await this.couples.getPartner(userId);

    if ((test.type === 'couple' || test.type === 'game') && !partner) {
      throw new BadRequestException('Этот тест доступен только в паре');
    }

    const session = await this.prisma.testSession.create({
      data: {
        testId: test.id,
        initiatorId: userId,
        coupleId: partner?.coupleId ?? null,
        status: test.type === 'personal' ? 'in_progress' : 'in_progress',
        participants: {
          create:
            test.type === 'personal'
              ? [{ userId, status: 'in_progress' }]
              : [
                  { userId, status: 'in_progress' },
                  { userId: partner!.id, status: 'pending' },
                ],
        },
      },
      include: {
        test: { include: { questions: { orderBy: { order: 'asc' } } } },
        participants: true,
      },
    });

    if (partner && test.type !== 'personal') {
      await this.bot.notifyUser(
        partner.telegramId,
        'Вас пригласили пройти совместный тест',
        `/tests/session/${session.id}`,
        'testInvites',
        partner.id,
      );
    }

    return session;
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: { include: { questions: { orderBy: { order: 'asc' } } } },
        participants: {
          include: { user: { select: { id: true, displayName: true } } },
        },
        answers: true,
      },
    });
    if (!session) throw new NotFoundException('Сессия не найдена');

    const isParticipant = session.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new BadRequestException('Нет доступа к сессии');

    const myAnswers = session.answers.filter((a) => a.userId === userId);
    const partner = session.participants.find((p) => p.userId !== userId);
    const bothDone =
      session.participants.length > 0 &&
      session.participants.every((p) => p.status === 'done');

    return {
      id: session.id,
      status: session.status,
      test: {
        id: session.test.id,
        slug: session.test.slug,
        title: session.test.title,
        description: session.test.description,
        type: session.test.type,
        questions: session.test.questions.map((q) => ({
          id: q.id,
          order: q.order,
          text: q.text,
          options: q.options,
        })),
      },
      participants: session.participants.map((p) => ({
        userId: p.userId,
        displayName: p.user.displayName,
        status: p.status,
      })),
      myAnswers: myAnswers.map((a) => ({
        questionId: a.questionId,
        optionId: a.optionId,
      })),
      result: bothDone || session.test.type === 'personal' ? session.resultJson : null,
      partnerWaiting: partner ? partner.status !== 'done' : false,
    };
  }

  async answer(
    userId: string,
    sessionId: string,
    data: { questionId: string; optionId: string },
  ) {
    const session = await this.getSession(userId, sessionId);
    const question = session.test.questions.find((q) => q.id === data.questionId);
    if (!question) throw new BadRequestException('Вопрос не найден');

    const options = question.options as Option[];
    if (!options.some((o) => o.id === data.optionId)) {
      throw new BadRequestException('Неверный вариант ответа');
    }

    await this.prisma.testAnswer.upsert({
      where: {
        sessionId_userId_questionId: {
          sessionId,
          userId,
          questionId: data.questionId,
        },
      },
      create: {
        sessionId,
        userId,
        questionId: data.questionId,
        optionId: data.optionId,
      },
      update: { optionId: data.optionId },
    });

    await this.prisma.testParticipant.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: { status: 'in_progress' },
    });

    return { ok: true };
  }

  async complete(userId: string, sessionId: string) {
    const full = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: { include: { questions: { orderBy: { order: 'asc' } } } },
        participants: {
          include: { user: { select: { id: true, displayName: true, telegramId: true } } },
        },
        answers: true,
      },
    });
    if (!full) throw new NotFoundException('Сессия не найдена');

    const myAnswers = full.answers.filter((a) => a.userId === userId);
    if (myAnswers.length < full.test.questions.length) {
      throw new BadRequestException('Ответьте на все вопросы');
    }

    await this.prisma.testParticipant.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: { status: 'done', completedAt: new Date() },
    });

    const refreshed = await this.prisma.testParticipant.findMany({
      where: { sessionId },
    });
    const allDone = refreshed.every((p) => p.status === 'done');

    if (!allDone) {
      await this.prisma.testSession.update({
        where: { id: sessionId },
        data: { status: 'waiting_partner' },
      });

      const partner = full.participants.find((p) => p.userId !== userId);
      if (partner) {
        await this.bot.notifyUser(
          partner.user.telegramId,
          'Партнёр завершил свою часть теста',
          `/tests/session/${sessionId}`,
          'testPartnerDone',
          partner.userId,
        );
      }

      return this.getSession(userId, sessionId);
    }

    const result = this.buildResult(full);
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        resultJson: result,
      },
    });

    return this.getSession(userId, sessionId);
  }

  private buildResult(session: {
    test: {
      type: string;
      title: string;
      questions: { id: string; text: string; options: unknown }[];
    };
    participants: { userId: string; user: { displayName: string } }[];
    answers: { userId: string; questionId: string; optionId: string }[];
  }) {
    const scores: Record<string, Record<string, number>> = {};
    const matches: { question: string; same: boolean; labels: string[] }[] = [];

    for (const p of session.participants) {
      scores[p.userId] = {};
    }

    for (const q of session.test.questions) {
      const options = q.options as Option[];
      const byUser = session.participants.map((p) => {
        const ans = session.answers.find(
          (a) => a.userId === p.userId && a.questionId === q.id,
        );
        const opt = options.find((o) => o.id === ans?.optionId);
        if (opt?.scoreKey) {
          scores[p.userId][opt.scoreKey] = (scores[p.userId][opt.scoreKey] || 0) + 1;
        }
        return { displayName: p.user.displayName, label: opt?.label ?? '—' };
      });

      if (session.test.type !== 'personal') {
        matches.push({
          question: q.text,
          same: byUser.length === 2 && byUser[0].label === byUser[1].label,
          labels: byUser.map((b) => `${b.displayName}: ${b.label}`),
        });
      }
    }

    const summaryParts: string[] = [];
    const discussion: string[] = [];

    if (session.test.type === 'personal') {
      const userId = session.participants[0].userId;
      const top = Object.entries(scores[userId] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);
      summaryParts.push(
        top.length
          ? `У вас сильнее всего проявились темы: ${top.map(([k]) => this.labelScore(k)).join(', ')}.`
          : 'Спасибо за ответы — это хороший повод прислушаться к себе.',
      );
      discussion.push(
        'Какой ответ дался сложнее всего и почему?',
        'Что из результата хочется бережнее учитывать в отношениях с собой?',
      );
    } else {
      const sameCount = matches.filter((m) => m.same).length;
      const total = matches.length || 1;
      const pct = Math.round((sameCount / total) * 100);
      summaryParts.push(
        `Вы совпали примерно в ${pct}% ответов. Совпадения — не оценка «правильности», а приглашение к разговору.`,
      );
      summaryParts.push(
        'Различия нормальны: они помогают лучше понять потребности друг друга.',
      );
      discussion.push(
        'Где ваши ответы разошлись — и что за этим может стоять?',
        'Какой вопрос хочется обсудить спокойно и без спешки?',
        'Что уже получается у вас особенно хорошо как у пары?',
      );
    }

    return {
      title: session.test.title,
      summary: summaryParts.join(' '),
      matches: session.test.type === 'personal' ? undefined : matches,
      scores,
      discussionQuestions: discussion,
      recommendations: [
        'Говорите от первого лица о своих чувствах и потребностях.',
        'Можно не соглашаться — важно слышать друг друга.',
        'Если тема задевает, сделайте паузу и вернитесь к разговору позже.',
      ],
    };
  }

  private labelScore(key: string) {
    const map: Record<string, string> = {
      words: 'слова поддержки',
      time: 'время вместе',
      gifts: 'знаки внимания',
      service: 'помощь делом',
      touch: 'тепло и близость',
      secure: 'надёжная опора',
      anxious: 'потребность в близости',
      avoidant: 'потребность в пространстве',
      boundaries: 'личные границы',
      needs: 'эмоциональные потребности',
      conflict_talk: 'разговор в конфликте',
      conflict_pause: 'пауза в конфликте',
      evening_home: 'уют дома',
      evening_out: 'выход в свет',
      knowledge: 'внимание к деталям',
    };
    return map[key] || key;
  }
}
