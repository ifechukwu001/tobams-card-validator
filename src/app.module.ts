import { Module } from '@nestjs/common';
import { CardsModule } from './cards/cards.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [DatabaseModule, CardsModule],
})
export class AppModule {}
