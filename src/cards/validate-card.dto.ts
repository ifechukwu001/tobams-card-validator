import { IsNumberString, IsString, Length, Matches } from 'class-validator';

export class ValidateCardDto {
  /** Digits only — no spaces, dashes or other separators. */
  @IsNumberString(
    { no_symbols: true },
    {
      message: 'cardNumber must contain only digits, no spaces or separators',
    },
  )
  @Length(13, 19, {
    message: 'cardNumber must be between 13 and 19 digits',
  })
  cardNumber!: string;

  /** Expiry date in MM/YY format. Any month in the future is valid. */
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'expiryDate must be in MM/YY format with a valid month (01-12)',
  })
  expiryDate!: string;

  /** Any 3-4 digit value is accepted. */
  @IsNumberString(
    { no_symbols: true },
    { message: 'cvv must contain only digits' },
  )
  @Length(3, 4, {
    message: 'cvv must be 3 or 4 digits',
  })
  cvv!: string;
}
