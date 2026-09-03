import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { DatabaseService } from '../database/database.service.js';
import { CardsService } from './cards.service.js';
import type { ValidateCardDto } from './validate-card.dto.js';

const VALID_CARD: ValidateCardDto = {
  cardNumber: '4111111111111111',
  expiryDate: '12/30',
  cvv: '123',
};

describe('CardsService', () => {
  let service: CardsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardsService,
        DatabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'DATABASE_URL' ? 'file::memory:' : undefined,
          },
        },
      ],
    }).compile();

    service = module.get(CardsService);
    db = module.get(DatabaseService);

    // Tests run against an ephemeral in-memory database, so migrations are
    // applied here instead of through the `db:migrate` CLI script.
    await migrate(db.db, { migrationsFolder: './drizzle' });
  });

  afterEach(() => {
    db.onModuleDestroy();
  });

  it('validates a correct card and returns a generated cardholder name', async () => {
    const result = await service.validate(VALID_CARD);

    expect(result.cardholderName).toMatch(/^\w+ \w+$/);
  });

  it('returns the same cached name when the identical card is validated again', async () => {
    const first = await service.validate(VALID_CARD);
    const second = await service.validate(VALID_CARD);

    expect(second).toEqual(first);
  });

  it('rejects a known card presented with a different cvv', async () => {
    await service.validate(VALID_CARD);

    await expect(service.validate({ ...VALID_CARD, cvv: '999' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.validate({ ...VALID_CARD, cvv: '999' }),
    ).rejects.toThrow('Card details do not match this card');
  });

  it('rejects a known card presented with a different expiry date', async () => {
    await service.validate(VALID_CARD);

    await expect(
      service.validate({ ...VALID_CARD, expiryDate: '01/31' }),
    ).rejects.toThrow('Card details do not match this card');
  });

  it('rejects a card number that fails the Luhn check', async () => {
    await expect(
      service.validate({ ...VALID_CARD, cardNumber: '4111111111111112' }),
    ).rejects.toThrow('Invalid card number');
  });

  it('does not persist a card that fails the Luhn check', async () => {
    await expect(
      service.validate({ ...VALID_CARD, cardNumber: '4111111111111112' }),
    ).rejects.toThrow('Invalid card number');

    // Fixing the last digit makes the number Luhn-valid; it must be treated
    // as a brand-new card, i.e. validation succeeds with a generated name.
    const result = await service.validate({
      ...VALID_CARD,
      cardNumber: '4111111111111111',
    });

    expect(result.cardholderName).toMatch(/^\w+ \w+$/);
  });

  it('rejects an expired card', async () => {
    await expect(
      service.validate({ ...VALID_CARD, expiryDate: '01/20' }),
    ).rejects.toThrow('Card has expired');
  });

  it('accepts a card expiring in the current month', async () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() % 100).padStart(2, '0');

    const result = await service.validate({
      cardNumber: '4242424242424242',
      expiryDate: `${month}/${year}`,
      cvv: '123',
    });

    expect(result.cardholderName).toMatch(/^\w+ \w+$/);
  });
});
