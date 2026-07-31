import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';
import { AuthUser, CardCategory } from '../types/models';

@Controller('cards')
@UseGuards(AuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('categories')
  categories() {
    return this.cardsService.listCategories();
  }

  @Get('draw')
  draw(@CurrentUser() user: AuthUser, @Query('category') category: CardCategory) {
    return this.cardsService.draw(user.id, category || CardCategory.closeness);
  }

  @Get('favorites')
  favorites(@CurrentUser() user: AuthUser) {
    return this.cardsService.favorites(user.id);
  }

  @Get('incoming')
  incoming(@CurrentUser() user: AuthUser) {
    return this.cardsService.incoming(user.id);
  }

  @Post(':id/favorite')
  favorite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cardsService.toggleFavorite(user.id, id);
  }

  @Post(':id/share')
  share(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cardsService.shareWithPartner(user.id, id);
  }
}
