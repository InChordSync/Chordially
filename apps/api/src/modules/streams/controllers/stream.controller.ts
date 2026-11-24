import { Controller, Post, Req, Res, Next, Param, Body } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { requestUserId } from "../../../shared/middleware/request-user-id.js";
import { streamService } from "../services/stream.service.js";
import { startStreamSchema } from "../validators/stream.validators.js";
import type { StartStreamRequest } from "../validators/stream.validators.js";
import { toStreamResponse } from "../types/stream.types.js";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe.js";

@Controller('streams')
export class StreamController {
  @Post()
  async start(
    @Req() req: Request,
    @Body(new ZodValidationPipe(startStreamSchema)) input: StartStreamRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const hostUserId = req.userId!;
      const { title } = input;
      const stream = await streamService.startStream(hostUserId, title);
      return res.status(201).json(toStreamResponse(stream));
    } catch (error) { next(error); }
  }

  @Post(':id/end')
  async end(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const hostUserId = req.userId!;
      const stream = await streamService.endStream(id, hostUserId);
      return res.status(200).json(toStreamResponse(stream));
    } catch (error) { next(error); }
  }
}
