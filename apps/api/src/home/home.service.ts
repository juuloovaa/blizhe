import { BadRequestException, Injectable } from '@nestjs/common';
import { DailyQuestionType, MoodType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CouplesService } from '../couples/couples.service';
import { BotService } from '../bot/bot.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couples: CouplesService,
    private readonly bot: BotService,
  ) {}

  private today(): Date {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private pickDaily<T extends { id: string }>(items: T[], salt: string): T | null {
    if (!items.length) return null;
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    let hash = day;
    for (let i = 0; i < salt.length; i++) hash = (hash * 31 + salt.charCodeAt(i)) >>> 0;
    return items[hash % items.length];
  }

  async getHome(userId: string) {
    const partner = await this.couples.getPartner(userId);
    const hasCouple = Boolean(partner);

    const soloQuestions = await this.prisma.dailyQuestion.findMany({
      where: { active: true, type: 'solo' },
    });
    const coupleQuestions = await this.prisma.dailyQuestion.findMany({
      where: { active: true, type: 'couple' },
    });

    const soloQ = this.pickDaily(soloQuestions, `solo:${userId}`);
    const coupleQ = hasCouple
      ? this.pickDaily(coupleQuestions, `couple:${partner!.coupleId}`)
      : null;

    const answerDate = this.today();

    const soloAnswer = soloQ
      ? await this.prisma.dailyAnswer.findUnique({
          where: {
            questionId_userId_answerDate: {
              questionId: soloQ.id,
              userId,
              answerDate,
            },
          },
        })
      : null;

    let couplePayload: unknown = null;
    if (coupleQ && partner) {
      const answers = await this.prisma.dailyAnswer.findMany({
        where: {
          questionId: coupleQ.id,
          answerDate,
          coupleId: partner.coupleId,
        },
        include: {
          user: { select: { id: true, displayName: true } },
        },
      });
      const mine = answers.find((a) => a.userId === userId) ?? null;
      const theirs = answers.find((a) => a.userId !== userId) ?? null;
      const bothAnswered = Boolean(mine && theirs);
      couplePayload = {
        question: coupleQ,
        myAnswer: mine ? { text: mine.answerText, createdAt: mine.createdAt } : null,
        partnerAnswer: bothAnswered
          ? { text: theirs!.answerText, displayName: theirs!.user.displayName, createdAt: theirs!.createdAt }
          : null,
        waitingForPartner: Boolean(mine && !theirs),
        revealed: bothAnswered,
      };
    }

    const recentMood = partner
      ? await this.prisma.moodNote.findFirst({
          where: { coupleId: partner.coupleId, authorId: partner.id },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const myRecentMood = partner
      ? await this.prisma.moodNote.findFirst({
          where: { coupleId: partner.coupleId, authorId: userId },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const testSessions = await this.prisma.testSession.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { participants: { some: { userId } } },
        ],
        status: { in: ['in_progress', 'waiting_partner', 'completed'] },
      },
      include: {
        test: true,
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      hasCouple,
      soloQuestion: soloQ
        ? {
            question: soloQ,
            myAnswer: soloAnswer
              ? { text: soloAnswer.answerText, createdAt: soloAnswer.createdAt }
              : null,
          }
        : null,
      coupleQuestion: couplePayload,
      partnerMood: recentMood
        ? {
            mood: recentMood.mood,
            note: recentMood.note,
            createdAt: recentMood.createdAt,
            readAt: recentMood.readAt,
          }
        : null,
      myMood: myRecentMood
        ? {
            mood: myRecentMood.mood,
            note: myRecentMood.note,
            createdAt: myRecentMood.createdAt,
          }
        : null,
      testInvites: testSessions.map((s) => ({
        sessionId: s.id,
        status: s.status,
        test: {
          id: s.test.id,
          title: s.test.title,
          type: s.test.type,
          slug: s.test.slug,
        },
        myStatus: s.participants.find((p) => p.userId === userId)?.status ?? null,
        partnerStatus:
          s.participants.find((p) => p.userId !== userId)?.status ?? null,
      })),
    };
  }

  async answerDaily(
    userId: string,
    data: { questionId: string; answerText: string; type: DailyQuestionType },
  ) {
    const text = data.answerText.trim();
    if (!text) throw new BadRequestException('Ответ не может быть пустым');

    const question = await this.prisma.dailyQuestion.findUnique({
      where: { id: data.questionId },
    });
    if (!question || !question.active) {
      throw new BadRequestException('Вопрос не найден');
    }

    const partner = await this.couples.getPartner(userId);
    if (question.type === 'couple' && !partner) {
      throw new BadRequestException('Парный вопрос доступен только в паре');
    }

    const answerDate = this.today();
    const answer = await this.prisma.dailyAnswer.upsert({
      where: {
        questionId_userId_answerDate: {
          questionId: question.id,
          userId,
          answerDate,
        },
      },
      create: {
        questionId: question.id,
        userId,
        coupleId: question.type === 'couple' ? partner!.coupleId : null,
        answerText: text,
        answerDate,
      },
      update: { answerText: text },
    });

    return answer;
  }

  async createMoodNote(userId: string, mood: MoodType, note?: string) {
    const partner = await this.couples.getPartner(userId);
    if (!partner) {
      throw new BadRequestException('Заметки о настроении доступны в паре');
    }

    const created = await this.prisma.moodNote.create({
      data: {
        authorId: userId,
        coupleId: partner.coupleId,
        mood,
        note: note?.trim() || null,
      },
    });

    await this.bot.notifyUser(
      partner.telegramId,
      'У вас новая заметка от партнёра',
      '/?tab=mood',
      'moodNotes',
      partner.id,
    );

    return created;
  }

  async markMoodRead(userId: string, noteId: string) {
    const partner = await this.couples.getPartner(userId);
    if (!partner) throw new BadRequestException('Нет пары');

    return this.prisma.moodNote.updateMany({
      where: { id: noteId, coupleId: partner.coupleId, authorId: { not: userId } },
      data: { readAt: new Date() },
    });
  }
}
