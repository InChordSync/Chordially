import { PipeTransform, Injectable } from '@nestjs/common';
import { AppError } from "../errors/app-error.js";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

@Injectable()
export class ImageContentTypePipe implements PipeTransform {
  transform(value: any) {
    if (!value || !ALLOWED_CONTENT_TYPES.includes(value)) {
      throw new AppError(
        400,
        "INVALID_CONTENT_TYPE",
        `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`
      );
    }
    return value;
  }
}
