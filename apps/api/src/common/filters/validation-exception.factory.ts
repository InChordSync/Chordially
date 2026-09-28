import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Custom exception factory to format class-validator validation failures
 * into the standardized Chordially error envelope shape (N-007 / N-009).
 */
export function validationExceptionFactory(errors: ValidationError[]) {
    const formattedErrors = errors.map((error) => ({
        field: error.property,
        constraints: error.constraints ? Object.values(error.constraints) : [],
    }));

    return new BadRequestException({
        success: false,
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed for one or more request fields.',
            details: formattedErrors,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    });
}