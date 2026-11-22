import { Injectable } from '@nestjs/common';
import { createAvatarUploadUrl, s3Client } from './s3.js';
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class FileService {
  async getAvatarUploadUrl(key: string, contentType: string) {
    return createAvatarUploadUrl(key, contentType);
  }

  async deleteAvatar(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env["AWS_S3_BUCKET"],
      Key: key,
    });
    await s3Client.send(command).catch(() => {});
  }

  async getSignedGetUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env["AWS_S3_BUCKET"],
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }
}
