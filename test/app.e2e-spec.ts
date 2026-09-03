import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { AppModule } from './../src/app.module.js';
import { EnvelopeExceptionFilter } from './../src/common/envelope-exception.filter.js';
import { ResponseInterceptor } from './../src/common/response.interceptor.js';
import { DatabaseService } from './../src/database/database.service.js';

const VALID_CARD = {
  cardNumber: '4111111111111111',
  expiryDate: '12/30',
  cvv: '123',
};

describe('POST /cards/validate (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'file::memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new EnvelopeExceptionFilter());

    // Ephemeral in-memory database — apply the committed migrations instead
    // of going through the `db:migrate` CLI script.
    const database = moduleFixture.get(DatabaseService);
    await migrate(database.db, { migrationsFolder: './drizzle' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.DATABASE_URL;
  });

  it('accepts a valid card and returns a cardholder name', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send(VALID_CARD)
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Card is valid');
    expect(response.body.data.cardholderName).toMatch(/^\w+ \w+$/);
  });

  it('returns the same cardholder name for a repeated identical request', async () => {
    const first = await request(app.getHttpServer())
      .post('/cards/validate')
      .send(VALID_CARD)
      .expect(200);

    const second = await request(app.getHttpServer())
      .post('/cards/validate')
      .send(VALID_CARD)
      .expect(200);

    expect(second.body).toEqual(first.body);
  });

  it('rejects a known card number with different details (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cvv: '999' })
      .expect(400);

    expect(response.body).toEqual({
      status: 'failed',
      message: 'Card details do not match this card',
    });
  });

  it('rejects a card number that fails the Luhn check (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cardNumber: '4111111111111112' })
      .expect(400);

    expect(response.body).toEqual({
      status: 'failed',
      message: 'Invalid card number',
    });
  });

  it('rejects an expired card (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, expiryDate: '01/20' })
      .expect(400);

    expect(response.body).toEqual({
      status: 'failed',
      message: 'Card has expired',
    });
  });

  it('rejects a card number containing spaces (422)', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cardNumber: '4111 1111 1111 1111' })
      .expect(422);

    expect(response.body.status).toBe('failed');
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toContain('cardNumber');
  });

  it('rejects a missing card number (422)', async () => {
    const { cardNumber: _omitted, ...body } = VALID_CARD;

    const response = await request(app.getHttpServer())
      .post('/cards/validate')
      .send(body)
      .expect(422);

    expect(response.body.status).toBe('failed');
  });

  it('rejects a malformed expiry date (422)', async () => {
    await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, expiryDate: '13/30' })
      .expect(422);

    await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, expiryDate: '2030-12' })
      .expect(422);
  });

  it('rejects a malformed cvv (422)', async () => {
    await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cvv: '12' })
      .expect(422);

    await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cvv: 'abcd' })
      .expect(422);
  });

  it('rejects unknown fields (422)', async () => {
    await request(app.getHttpServer())
      .post('/cards/validate')
      .send({ ...VALID_CARD, cardholderName: 'Jane Doe' })
      .expect(422);
  });
});
