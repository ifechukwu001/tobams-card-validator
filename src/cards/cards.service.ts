import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { cards } from '../database/schema';
import { isValidCardNumber } from './luhn';
import type { ValidateCardDto } from './validate-card.dto';

export interface CardValidationData {
  cardholderName: string;
}

// ~50 x ~50 names => thousands of combinations, so generated cardholder
// names look like real people rather than a handful of canned entries.
const FIRST_NAMES = [
  'Aaron', 'Abigail', 'Ada', 'Alan', 'Alex', 'Alice', 'Amara', 'Amelia',
  'Anita', 'Barbara', 'Benjamin', 'Brenda', 'Brian', 'Carlos', 'Caroline',
  'Chidi', 'Chloe', 'Daniel', 'David', 'Dennis', 'Donald', 'Edith', 'Edsger',
  'Emeka', 'Emily', 'Frances', 'Frank', 'Grace', 'Hannah', 'Henry', 'Ifeoma',
  'Isaac', 'James', 'Jane', 'John', 'Joseph', 'Joy', 'Julia', 'Katherine',
  'Kevin', 'Laura', 'Linus', 'Lucy', 'Margaret', 'Maria', 'Mark', 'Mary',
  'Michael', 'Ngozi', 'Olivia', 'Peter', 'Radia', 'Robert', 'Ruth', 'Samuel',
  'Sarah', 'Sophia', 'Tim', 'Victor', 'Zara',
];

const LAST_NAMES = [
  'Abbas', 'Adams', 'Allen', 'Anderson', 'Bakare', 'Bennett', 'Borg',
  'Brooks', 'Campbell', 'Carter', 'Chen', 'Clark', 'Cooper', 'Davis',
  'Dijkstra', 'Edwards', 'Evans', 'Fisher', 'Garcia', 'Glover', 'Gonzalez',
  'Graham', 'Hamilton', 'Hernandez', 'Hopper', 'Howard', 'Ibrahim',
  'Jackson', 'Johnson', 'Jones', 'Kelly', 'Kim', 'Knuth', 'Lewis',
  'Liskov', 'Lovelace', 'Martin', 'Martinez', 'Miller', 'Moore', 'Morgan',
  'Nelson', 'Okafor', 'Osei', 'Parker', 'Perlman', 'Ritchie', 'Roberts',
  'Robinson', 'Rodriguez', 'Scott', 'Smith', 'Taylor', 'Torvalds', 'Turing',
  'Walker', 'White', 'Williams', 'Wilson', 'Wright', 'Young',
];

const randomItem = (items: string[]): string =>
  items[Math.floor(Math.random() * items.length)];

const generateCardholderName = (): string =>
  `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;

/**
 * A card number is considered registered the first time it passes the Luhn
 * and expiry checks: we persist the generated cardholder name together with
 * the expiry date and CVV that were presented. Any later request for the
 * same number must present the exact same expiry and CVV, otherwise it is
 * rejected — and when it matches, the originally generated name is returned.
 */
@Injectable()
export class CardsService {
  constructor(private readonly database: DatabaseService) {}

  async validate(dto: ValidateCardDto): Promise<CardValidationData> {
    if (!isValidCardNumber(dto.cardNumber)) {
      throw new BadRequestException('Invalid card number');
    }

    if (this.isExpired(dto.expiryDate)) {
      throw new BadRequestException('Card has expired');
    }

    const stored = await this.findCard(dto.cardNumber);

    if (!stored) {
      const cardholderName = generateCardholderName();
      await this.database.db.insert(cards).values({
        cardNumber: dto.cardNumber,
        cardholderName,
        expiryDate: dto.expiryDate,
        cvv: dto.cvv,
      });
      return { cardholderName };
    }

    if (stored.expiryDate !== dto.expiryDate || stored.cvv !== dto.cvv) {
      throw new BadRequestException('Card details do not match this card');
    }

    return { cardholderName: stored.cardholderName };
  }

  /** Cards are valid through the end of their expiry month. */
  private isExpired(expiryDate: string): boolean {
    const [monthPart, yearPart] = expiryDate.split('/');
    const expiryMonth = Number(monthPart);
    const expiryYear = 2000 + Number(yearPart);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    );
  }

  private async findCard(cardNumber: string) {
    const rows = await this.database.db
      .select()
      .from(cards)
      .where(eq(cards.cardNumber, cardNumber))
      .limit(1);
    return rows[0] ?? null;
  }
}
