import { Injectable } from '@nestjs/common';
import { User, UserMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramWebAppUser } from '../auth/telegram-auth.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromTelegram(tg: TelegramWebAppUser): Promise<User> {
    const telegramId = BigInt(tg.id);
    const displayName =
      [tg.first_name, tg.last_name].filter(Boolean).join(' ') || tg.username || 'Пользователь';

    const existing = await this.prisma.user.findUnique({ where: { telegramId } });
    if (existing) {
      return this.prisma.user.update({
        where: { telegramId },
        data: {
          username: tg.username ?? null,
          firstName: tg.first_name ?? null,
          lastName: tg.last_name ?? null,
          photoUrl: tg.photo_url ?? null,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId,
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        photoUrl: tg.photo_url ?? null,
        displayName,
        notificationSettings: { create: {} },
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        notificationSettings: true,
        memberships: {
          where: { leftAt: null, couple: { status: 'active' } },
          include: {
            couple: {
              include: {
                members: {
                  where: { leftAt: null },
                  include: {
                    user: {
                      select: {
                        id: true,
                        displayName: true,
                        photoUrl: true,
                        pronouns: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const membership = user.memberships[0] ?? null;
    const partner =
      membership?.couple.members.find((m) => m.userId !== userId)?.user ?? null;

    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      displayName: user.displayName,
      pronouns: user.pronouns,
      mode: user.mode,
      onboardingCompleted: user.onboardingCompleted,
      notificationSettings: user.notificationSettings,
      couple: membership
        ? {
            id: membership.couple.id,
            status: membership.couple.status,
            role: membership.role,
            partner,
          }
        : null,
    };
  }

  async completeOnboarding(
    userId: string,
    data: { mode: UserMode; displayName?: string; pronouns?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        mode: data.mode,
        displayName: data.displayName?.trim() || undefined,
        pronouns: data.pronouns?.trim() || null,
        onboardingCompleted: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; pronouns?: string | null; mode?: UserMode },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName?.trim(),
        pronouns: data.pronouns === undefined ? undefined : data.pronouns?.trim() || null,
        mode: data.mode,
      },
    });
  }

  async updateNotificationSettings(
    userId: string,
    data: Partial<{
      moodNotes: boolean;
      testInvites: boolean;
      testPartnerDone: boolean;
      dailyQuestion: boolean;
      partnerCard: boolean;
    }>,
  ) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async deleteAccount(userId: string) {
    const memberships = await this.prisma.coupleMember.findMany({
      where: { userId, leftAt: null, couple: { status: 'active' } },
    });

    for (const m of memberships) {
      await this.prisma.$transaction([
        this.prisma.coupleMember.updateMany({
          where: { coupleId: m.coupleId, leftAt: null },
          data: { leftAt: new Date() },
        }),
        this.prisma.couple.update({
          where: { id: m.coupleId },
          data: { status: 'dissolved', dissolvedAt: new Date() },
        }),
        this.prisma.moodNote.deleteMany({ where: { coupleId: m.coupleId } }),
        this.prisma.cardShare.deleteMany({ where: { coupleId: m.coupleId } }),
        this.prisma.dailyAnswer.deleteMany({ where: { coupleId: m.coupleId } }),
      ]);
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
