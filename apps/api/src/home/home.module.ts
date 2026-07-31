import { Module, forwardRef } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { AuthModule } from '../auth/auth.module';
import { CouplesModule } from '../couples/couples.module';

@Module({
  imports: [forwardRef(() => AuthModule), CouplesModule],
  providers: [HomeService],
  controllers: [HomeController],
})
export class HomeModule {}
