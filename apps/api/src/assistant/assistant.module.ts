import { Module, forwardRef } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [AssistantService],
  controllers: [AssistantController],
})
export class AssistantModule {}
