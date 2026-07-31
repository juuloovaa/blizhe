import { Module, forwardRef } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { AuthModule } from '../auth/auth.module';
import { CouplesModule } from '../couples/couples.module';

@Module({
  imports: [forwardRef(() => AuthModule), CouplesModule],
  providers: [TestsService],
  controllers: [TestsController],
})
export class TestsModule {}
