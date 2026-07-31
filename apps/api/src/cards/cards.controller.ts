import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CardCategory, User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';

@Controller('cards')
@UseGuards(AuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('categories')
  categories() {
    return this.cardsService.listCategories();
  }

  @Get('draw')
  draw(@CurrentUser() user: User, @Query('category') category: CardCategory) {
    return this.cardsService.draw(user.id, category || 'closeness');
  }

  @Get('favorites')
  favorites(@CurrentUser() user: User) {
    return this.cardsService.favorites(user.id);
  }

  @Get('incoming')
  incoming(@CurrentUser() user: User) {
    return this.cardsService.incoming(user.id);
  }

  @Post(':id/favorite')
  favorite(@CurrentUser() user: User, @Param('id') id: string) {
    return this.cardsService.toggleFavorite(user.id, id);
  }

  @Post(':id/share')
  share(@CurrentUser() user: User, @Param('id') id: string) {
    return this.cardsService.shareWithPartner(user.id, id);
  }
}
