import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { logger } from "../logger/logger.js";
import { createAvatarUploadUrl } from './s3.js';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

@Injectable()
export class FileService {
  async getAvatarUploadUrl(key: string, contentType: string) {
    return createAvatarUploadUrl(key, contentType);
  }

  async deleteAvatar(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    try {
      await s3Client.send(command);
    } catch (error) {
      logger.error("Failed to delete avatar object", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      // Callers decide whether cleanup is optional; never hide the failure.
      throw error;
    }
  }

  async getSignedGetUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }
}
