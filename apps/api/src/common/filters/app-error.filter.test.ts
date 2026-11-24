import 'reflect-metadata';
import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../shared/errors/app-error.js';
import { ImageContentTypePipe } from '../../shared/pipes/image-content-type.pipe.js';
import { AppErrorFilter } from './app-error.filter.js';

function httpHost(response: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }): ArgumentsHost {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
}

describe('AppErrorFilter', () => {
  it('maps an AppError thrown by ImageContentTypePipe to the documented 400 envelope', () => {
    let error: unknown;
    try {
      new ImageContentTypePipe().transform('application/pdf');
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(AppError);

    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    new AppErrorFilter().catch(error as AppError, httpHost(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: expect.stringContaining('contentType must be one of'),
      },
    });
  });

  it('passes an accepted content type through the pipe', () => {
    expect(new ImageContentTypePipe().transform('image/png')).toBe('image/png');
  });

  it('leaves non-HTTP contexts alone', () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = { ...httpHost(response), getType: () => 'rpc' } as ArgumentsHost;

    new AppErrorFilter().catch(new AppError(400, 'INVALID_CONTENT_TYPE', 'bad'), host);

    expect(response.status).not.toHaveBeenCalled();
  });
});
