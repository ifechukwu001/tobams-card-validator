import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnprocessableEntityException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CardsService, type CardValidationData } from './cards.service';
import { ValidateCardDto } from './validate-card.dto';

/**
 * Malformed or missing input is rejected with 422 (unprocessable entity)
 * carrying the first validation error as the message. Cards that parse but
 * fail validation (Luhn, expiry, mismatched details) are rejected with 400
 * by the service. Both are rendered in the shared envelope by the global
 * exception filter.
 */
const bodyValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  exceptionFactory: (errors) => {
    const constraints = errors[0].constraints;
    const message = constraints
      ? Object.values(constraints)[0]
      : 'Validation failed';
    return new UnprocessableEntityException(message);
  },
});

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(bodyValidationPipe)
  validate(@Body() dto: ValidateCardDto): Promise<CardValidationData> {
    return this.cardsService.validate(dto);
  }
}
