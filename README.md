# Card Number Validation API

A NestJS + TypeScript API that validates card numbers using the Luhn algorithm.
Cards that pass validation are registered in a Turso/libSQL database with a
randomly generated cardholder name.

## Running locally

```bash
pnpm install
pnpm start:dev
```

The API listens on http://localhost:3000. Data is stored in `./data/cards.db`
by default.

To use a different database, set environment variables:

```bash
# Local Turso server (turso dev --db-file local.db)
DATABASE_URL=http://127.0.0.1:8080

# Turso Cloud
DATABASE_URL=libsql://<database>-<org>.turso.io
DATABASE_AUTH_TOKEN=eyJ...
```

Run tests:

```bash
pnpm test        # unit tests
pnpm test:e2e    # end-to-end tests
```

## Deploying to Vercel

1. Create a [Turso Cloud](https://turso.tech) database and get the URL + auth token.
2. Apply migrations locally against Turso:
   ```bash
   DATABASE_URL=libsql://<db>-<org>.turso.io DATABASE_AUTH_TOKEN=eyJ... pnpm db:migrate
   ```
3. Deploy to Vercel (no special config needed — Vercel auto-detects NestJS):
   ```bash
   vercel --prod
   ```
   Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in the Vercel project settings.

## Status codes

| Code | Meaning |
|------|---------|
| **200** | Validation completed — check `status` field for `"success"` or `"failed"` |
| **400** | User error — card is invalid (bad Luhn, expired, details mismatch) |
| **422** | Validation error — malformed or missing request fields |

## Calling the deployed API

`POST https://<deployed-url>/cards/validate`

```bash
# Valid card → 200
curl -X POST https://<deployed-url>/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111111111111111", "expiryDate": "12/30", "cvv": "123"}'
# {"status":"success","message":"Card is valid","data":{"cardholderName":"Samuel Knuth"}}

# Invalid card (Luhn failure) → 400
curl -X POST https://<deployed-url>/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111111111111112", "expiryDate": "12/30", "cvv": "123"}'
# {"status":"failed","message":"Invalid card number"}

# Card expired → 400
curl -X POST https://<deployed-url>/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111111111111111", "expiryDate": "01/20", "cvv": "123"}'
# {"status":"failed","message":"Card has expired"}

# Card number with spaces → 422
curl -X POST https://<deployed-url>/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111 1111 1111 1111", "expiryDate": "12/30", "cvv": "123"}'
# {"status":"failed","message":"cardNumber must contain only digits, no spaces or separators"}
```

## Decisions

- **Luhn algorithm** for card number validation, implemented as a pure,
  unit-tested function.
- **Registry semantics**: the first successful validation persists the card
  number with the presented expiry/CVV and a generated name. Later requests
  for the same number must match the original expiry and CVV; mismatches are
  rejected, and matches return the cached name.
- **Turso/libSQL storage** via `drizzle-orm` + `@libsql/client`: the same
  code runs against a local SQLite file, a local `turso dev` server, or
  Turso Cloud. Schema changes use `pnpm db:migrate`.
- **Response envelope**: all responses follow `{ status, message, data? }`.
  Business failures (Luhn, expired, mismatch) return 400; validation errors
  (missing/bad fields) return 422.
