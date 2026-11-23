import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logger/logger.js';

@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  catch(error: AppError, host: ArgumentsHost): void {
    if (host.getType() !== 'http') return;

    if (error.statusCode >= 500) {
      logger.error('Unhandled AppError', { code: error.code, message: error.message });
    }

    const response = host.switchToHttp().getResponse<Response>();
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
  }
}
