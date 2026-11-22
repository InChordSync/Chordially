import { Controller, Post, Get, Req, Res, Next, Param, Body } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { streamService } from "../services/stream.service.js";
import { toStreamResponse } from "../types/stream.types.js";

@Controller('streams')
export class StreamController {
  @Post()
  async start(@Req() req: Request, @Body() body: any, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const hostUserId = (req as any).userId!;
      const { title } = body;
      const stream = await streamService.startStream(hostUserId, title);
      return res.status(201).json(toStreamResponse(stream));
    } catch (error) { next(error); }
  }

  @Post(':id/end')
  async end(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    try {
      const hostUserId = (req as any).userId!;
      const stream = await streamService.endStream(id, hostUserId);
      return res.status(200).json(toStreamResponse(stream));
    } catch (error) { next(error); }
  }
}
