import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CouplesModule } from './couples/couples.module';
import { HomeModule } from './home/home.module';
import { CardsModule } from './cards/cards.module';
import { TestsModule } from './tests/tests.module';
import { AssistantModule } from './assistant/assistant.module';
import { BotModule } from './bot/bot.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    BotModule,
    AuthModule,
    UsersModule,
    CouplesModule,
    HomeModule,
    CardsModule,
    TestsModule,
    AssistantModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
