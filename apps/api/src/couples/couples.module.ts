import { Module, forwardRef } from '@nestjs/common';
import { CouplesService } from './couples.service';
import { CouplesController } from './couples.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [CouplesService],
  controllers: [CouplesController],
  exports: [CouplesService],
})
export class CouplesModule {}
