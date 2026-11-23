import { Controller, Post, Body, Req, Res, Next } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, NextFunction } from 'express';
import { authService } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";
import { Public } from "../../../shared/decorators/public.decorator.js";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe.js";
import { env } from "../../../shared/config/env.js";

@Public()
@Throttle({
  default: {
    limit: env.AUTH_RATE_LIMIT_MAX,
    ttl: env.AUTH_RATE_LIMIT_WINDOW_MS,
  },
})
@Controller('auth')
export class AuthController {
  @Post('register')
  async register(
    @Req() req: Request,
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const result = await authService.register(input);
      return res.status(201).json(result);
    } catch (error) { next(error); }
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const result = await authService.login(input);
      return res.status(200).json(result);
    } catch (error) { next(error); }
  }
}
