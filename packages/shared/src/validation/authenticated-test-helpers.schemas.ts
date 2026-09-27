import { z } from 'zod';

export const testUserContextSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  email: z.string().email(),
  role: z.enum(['user', 'creator', 'admin']).default('user'),
  tenantId: z.string().optional(),
});

export const mockAuthTokenHeaderSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
  'x-test-user-id': z.string().min(1),
  'x-test-user-role': z.string().min(1),
});

export type TestUserContextInput = z.infer<typeof testUserContextSchema>;
