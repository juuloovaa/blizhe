import { Module, forwardRef } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { AuthModule } from '../auth/auth.module';
import { CouplesModule } from '../couples/couples.module';

@Module({
  imports: [forwardRef(() => AuthModule), CouplesModule],
  providers: [CardsService],
  controllers: [CardsController],
})
export class CardsModule {}
