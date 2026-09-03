const MIN_LENGTH = 13;
const MAX_LENGTH = 19;

/**
 * Validates a card number with the Luhn checksum algorithm.
 * Expects a digits-only string (no spaces or separators); anything else
 * returns false.
 */
export function isValidCardNumber(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) {
    return false;
  }
  if (cardNumber.length < MIN_LENGTH || cardNumber.length > MAX_LENGTH) {
    return false;
  }

  let sum = 0;
  let doubleDigit = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = cardNumber.charCodeAt(i) - 48; // '0' === 48

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}
