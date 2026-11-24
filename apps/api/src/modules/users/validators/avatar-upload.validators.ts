import { z } from "zod";

export const avatarUploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"], {
    errorMap: () => ({ message: "contentType must be a supported image type" }),
  }),
});

export type AvatarUploadRequest = z.infer<typeof avatarUploadSchema>;
