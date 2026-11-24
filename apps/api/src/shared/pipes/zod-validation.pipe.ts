import { Injectable, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodTypeAny>
  implements PipeTransform<unknown, z.output<TSchema>>
{
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Invalid request',
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }

    return result.data;
  }
}
