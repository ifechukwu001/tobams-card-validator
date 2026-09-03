import { Module } from '@nestjs/common';
import { CardsModule } from './cards/cards.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, CardsModule],
})
export class AppModule {}
