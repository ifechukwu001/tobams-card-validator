import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

export interface FailureEnvelope {
  status: 'failed';
  message: string;
}

/**
 * Renders every error in the shared envelope. Validation errors surface as
 * 422 (unprocessable entity) and business validation failures as 400; the
 * message is always a single, human-readable string.
 */
@Catch()
export class EnvelopeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const failure: FailureEnvelope = {
      status: 'failed',
      message: this.extractMessage(exception),
    };

    response.status(status).json(failure);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return body;
      }
      if (typeof body === 'object' && body !== null) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
        if (Array.isArray(message) && typeof message[0] === 'string') {
          return message[0];
        }
      }
      return exception.message;
    }
    return 'Internal server error';
  }
}
