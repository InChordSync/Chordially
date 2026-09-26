import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { metrics } from "./metrics.js";

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics(@Req() req: Request, @Res() res: Response) {
    return res.status(200).json(metrics.getSnapshot());
  }
}
