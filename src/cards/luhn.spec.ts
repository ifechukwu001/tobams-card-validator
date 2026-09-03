import { describe, expect, it } from 'vitest';
import { isValidCardNumber } from './luhn.js';

describe('isValidCardNumber', () => {
  it.each([
    '4111111111111111', // Visa test number
    '4242424242424242', // Stripe test number
    '4222222222222', // 13-digit Visa test number
    '378282246310005', // Amex test number
    '30569309025904', // Diners Club test number
  ])('accepts the valid number %s', (cardNumber) => {
    expect(isValidCardNumber(cardNumber)).toBe(true);
  });

  it('rejects a number with a wrong checksum', () => {
    expect(isValidCardNumber('4111111111111112')).toBe(false);
  });

  it('rejects a number with a transposed digit', () => {
    expect(isValidCardNumber('79927398731')).toBe(false);
  });

  it.each(['4111 1111 1111 1111', '4111-1111-1111-1111', '4111abcd1111'])(
    'rejects non-digit input: %s',
    (cardNumber) => {
      expect(isValidCardNumber(cardNumber)).toBe(false);
    },
  );

  it('rejects numbers that are too short', () => {
    expect(isValidCardNumber('123456789012')).toBe(false);
  });

  it('rejects numbers that are too long', () => {
    expect(isValidCardNumber('41111111111111111111')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidCardNumber('')).toBe(false);
  });
});
