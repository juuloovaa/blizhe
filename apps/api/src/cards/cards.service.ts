import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CardCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CouplesService } from '../couples/couples.service';
import { BotService } from '../bot/bot.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couples: CouplesService,
    private readonly bot: BotService,
  ) {}

  async listCategories() {
    return [
      { id: 'closeness', title: 'На сближение', description: 'Вопросы, чтобы лучше узнать друг друга' },
      { id: 'reflection', title: 'На размышление', description: 'Личная рефлексия о чувствах и границах' },
      { id: 'romance', title: 'Романтика', description: 'Идеи для тепла и совместного времени' },
    ];
  }

  async draw(userId: string, category: CardCategory) {
    if (category === 'intimate') {
      throw new BadRequestException('Раздел недоступен в MVP');
    }

    const cards = await this.prisma.card.findMany({
      where: { active: true, isAdult: false, category },
    });
    if (!cards.length) throw new NotFoundException('Карточки не найдены');

    const card = cards[Math.floor(Math.random() * cards.length)];
    const favorite = await this.prisma.favoriteCard.findUnique({
      where: { userId_cardId: { userId, cardId: card.id } },
    });

    return { ...card, isFavorite: Boolean(favorite) };
  }

  async favorites(userId: string) {
    const rows = await this.prisma.favoriteCard.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ ...r.card, favoritedAt: r.createdAt }));
  }

  async toggleFavorite(userId: string, cardId: string) {
    const existing = await this.prisma.favoriteCard.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    if (existing) {
      await this.prisma.favoriteCard.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favoriteCard.create({ data: { userId, cardId } });
    return { favorited: true };
  }

  async shareWithPartner(userId: string, cardId: string) {
    const partner = await this.couples.getPartner(userId);
    if (!partner) throw new BadRequestException('Нужна пара, чтобы отправить карточку');

    const card = await this.prisma.card.findFirst({
      where: { id: cardId, active: true, isAdult: false },
    });
    if (!card) throw new NotFoundException('Карточка не найдена');

    const share = await this.prisma.cardShare.create({
      data: {
        cardId,
        fromUserId: userId,
        toUserId: partner.id,
        coupleId: partner.coupleId,
      },
    });

    await this.bot.notifyUser(
      partner.telegramId,
      'Партнёр отправил вам карточку',
      '/cards',
      'partnerCard',
      partner.id,
    );

    return share;
  }

  async incoming(userId: string) {
    return this.prisma.cardShare.findMany({
      where: { toUserId: userId },
      include: {
        card: true,
        fromUser: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
