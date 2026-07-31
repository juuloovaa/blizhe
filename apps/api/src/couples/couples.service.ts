import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouplesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private inviteLink(code: string) {
    const username = this.config.get<string>('TELEGRAM_BOT_USERNAME') || 'BlizheBot';
    return `https://t.me/${username}?start=invite_${code}`;
  }

  async getActiveMembership(userId: string) {
    return this.prisma.coupleMember.findFirst({
      where: { userId, leftAt: null, couple: { status: 'active' } },
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
                    telegramId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getPartner(userId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) return null;
    const partner = membership.couple.members.find((m) => m.userId !== userId)?.user;
    return partner
      ? {
          id: partner.id,
          displayName: partner.displayName,
          photoUrl: partner.photoUrl,
          pronouns: partner.pronouns,
          telegramId: partner.telegramId,
          coupleId: membership.coupleId,
        }
      : null;
  }

  async createInvite(userId: string) {
    const existing = await this.getActiveMembership(userId);
    if (existing) {
      throw new BadRequestException('Вы уже в паре');
    }

    await this.prisma.coupleInvite.updateMany({
      where: { inviterId: userId, status: 'pending' },
      data: { status: 'cancelled' },
    });

    const code = randomBytes(6).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await this.prisma.coupleInvite.create({
      data: { code, inviterId: userId, expiresAt },
    });

    return {
      code: invite.code,
      expiresAt: invite.expiresAt,
      link: this.inviteLink(invite.code),
    };
  }

  async getPendingInvite(userId: string) {
    const invite = await this.prisma.coupleInvite.findFirst({
      where: { inviterId: userId, status: 'pending', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!invite) return null;
    return { ...invite, link: this.inviteLink(invite.code) };
  }

  async cancelInvite(userId: string, code?: string) {
    const where = code
      ? { code, inviterId: userId, status: 'pending' as const }
      : { inviterId: userId, status: 'pending' as const };

    const result = await this.prisma.coupleInvite.updateMany({
      where,
      data: { status: 'cancelled' },
    });
    return { cancelled: result.count };
  }

  async previewInvite(userId: string, code: string) {
    const invite = await this.prisma.coupleInvite.findUnique({
      where: { code },
      include: {
        inviter: {
          select: { id: true, displayName: true, photoUrl: true },
        },
      },
    });
    if (!invite || invite.status !== 'pending') {
      throw new NotFoundException('Приглашение не найдено или уже недействительно');
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.coupleInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Срок приглашения истёк');
    }
    if (invite.inviterId === userId) {
      throw new BadRequestException('Нельзя принять собственное приглашение');
    }

    const blocked = await this.isBlockedEither(userId, invite.inviterId);
    if (blocked) {
      throw new ForbiddenException('Соединение недоступно');
    }

    return {
      code: invite.code,
      inviter: invite.inviter,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(userId: string, code: string) {
    const preview = await this.previewInvite(userId, code);
    const myCouple = await this.getActiveMembership(userId);
    if (myCouple) {
      throw new BadRequestException('Сначала отключитесь от текущей пары');
    }

    const inviterCouple = await this.getActiveMembership(preview.inviter.id);
    if (inviterCouple) {
      throw new BadRequestException('Пригласивший уже в паре');
    }

    const couple = await this.prisma.$transaction(async (tx) => {
      const created = await tx.couple.create({ data: {} });
      await tx.coupleMember.createMany({
        data: [
          { coupleId: created.id, userId: preview.inviter.id, role: 'inviter' },
          { coupleId: created.id, userId, role: 'invitee' },
        ],
      });
      await tx.coupleInvite.update({
        where: { code },
        data: { status: 'accepted', coupleId: created.id },
      });
      await tx.user.updateMany({
        where: { id: { in: [preview.inviter.id, userId] } },
        data: { mode: 'couple' },
      });
      return created;
    });

    return { coupleId: couple.id, partner: preview.inviter };
  }

  async disconnect(userId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) {
      throw new BadRequestException('Вы не в паре');
    }

    await this.prisma.$transaction([
      this.prisma.coupleMember.updateMany({
        where: { coupleId: membership.coupleId, leftAt: null },
        data: { leftAt: new Date() },
      }),
      this.prisma.couple.update({
        where: { id: membership.coupleId },
        data: { status: 'dissolved', dissolvedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async deleteCoupleData(userId: string) {
    const membership = await this.getActiveMembership(userId);
    if (!membership) {
      throw new BadRequestException('Вы не в паре');
    }
    const coupleId = membership.coupleId;

    await this.prisma.$transaction([
      this.prisma.moodNote.deleteMany({ where: { coupleId } }),
      this.prisma.cardShare.deleteMany({ where: { coupleId } }),
      this.prisma.dailyAnswer.deleteMany({ where: { coupleId } }),
      this.prisma.testSession.updateMany({
        where: { coupleId },
        data: { status: 'cancelled', resultJson: Prisma.DbNull },
      }),
    ]);

    return { ok: true };
  }

  async blockPartner(userId: string) {
    const partner = await this.getPartner(userId);
    if (!partner) {
      throw new BadRequestException('Партнёр не найден');
    }

    await this.prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: partner.id },
      },
      create: { blockerId: userId, blockedId: partner.id },
      update: {},
    });

    await this.disconnect(userId);
    return { ok: true };
  }

  async isBlockedEither(a: string, b: string) {
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });
    return Boolean(row);
  }
}
