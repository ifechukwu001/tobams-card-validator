# Card Number Validation API

A NestJS + TypeScript API that validates card numbers using the Luhn algorithm.
Cards that pass validation are registered in a libSQL/SQLite database (local
file, local Turso server, or Turso Cloud) with a randomly generated cardholder
name.

## Running locally

```bash
pnpm install
pnpm start:dev
```

The API is now listening on http://localhost:3000. By default it stores data
in a local SQLite file at `./data/cards.db` — no setup required.

To use a different database, copy `.env.example` to `.env` and set:

```bash
# Local Turso server (turso dev --db-file local.db)
DATABASE_URL=http://127.0.0.1:8080

# Turso Cloud
DATABASE_URL=libsql://<database>-<org>.turso.io
DATABASE_AUTH_TOKEN=eyJ...
```

Run the tests with:

```bash
pnpm test        # unit tests
pnpm test:e2e    # end-to-end tests
```

## Calling the deployed API

`POST https://tobams-card-validator-indol.vercel.app/cards/validate`

```bash
# Valid card → 200
curl -X POST https://tobams-card-validator-indol.vercel.app/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111111111111111", "expiryDate": "12/30", "cvv": "123"}'
# {"valid":true,"cardholderName":"Donald Allen"}

# Invalid card (Luhn failure / expired / mismatched details) → 200
curl -X POST https://tobams-card-validator-indol.vercel.app/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111111111111112", "expiryDate": "12/30", "cvv": "123"}'
# {"valid":false,"reason":"Invalid card number"}

# Malformed request → 400
curl -X POST https://tobams-card-validator-indol.vercel.app/cards/validate \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber": "4111 1111 1111 1111"}'
# {"message":["cardNumber must contain only digits, no spaces or separators", ...], "statusCode":400}
```

Notes:

- `cardNumber` must be 13–19 digits with no spaces or separators.
- `expiryDate` is `MM/YY`; any month in the future is valid.
- `cvv` is any 3–4 digit value.
- Repeating a validated card with the same expiry and CVV returns the same
  cardholder name; a different expiry or CVV is rejected.

## Decisions

- **Luhn algorithm** for card number validation, implemented as a pure,
  unit-tested function.
- **Registry semantics**: the first successful validation persists the card
  number together with the presented expiry date, CVV and a randomly
  generated cardholder name. Later requests for the same number must present
  the same expiry and CVV — otherwise the card is rejected — and always get
  the originally generated name back.
- **Turso/libSQL storage** via `@libsql/client`: the same code runs against a
  local SQLite file, a local `turso dev` server, or Turso Cloud, selected
  purely through `DATABASE_URL` / `DATABASE_AUTH_TOKEN`.
- **HTTP semantics**: completed validations always return 200 (the outcome is
  data, not an error) with user-friendly reasons; only malformed or missing
  input returns 400.
