import { Controller, Post, Body, Req, Res, Next } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { authService } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

@Controller('auth')
export class AuthController {
  @Post('register')
  async register(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const input = registerSchema.parse(body);
      const result = await authService.register(input);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  @Post('login')
  async login(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const input = loginSchema.parse(body);
      const result = await authService.login(input);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
