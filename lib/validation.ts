import { z } from 'zod';
import { validateChatGPTUrl } from './chatgpt-url';

export const sessionStatusEnum = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const sessionStatusSchema = z.enum(sessionStatusEnum);

export const createSessionSchema = z.object({
  topic: z
    .string({ message: 'Topic is required.' })
    .trim()
    .min(1, 'Topic cannot be empty.')
    .max(255, 'Topic must be 255 characters or fewer.'),
  chatgptUrl: z
    .string({ message: 'ChatGPT conversation link is required.' })
    .trim()
    .min(1, 'ChatGPT conversation link is required.')
    .refine((url) => validateChatGPTUrl(url).isValid, {
      message:
        'Please enter a valid, official HTTPS ChatGPT link (e.g. https://chatgpt.com/c/...)',
    }),
  status: sessionStatusSchema.optional().default('PLANNED'),
  notes: z.string().max(10000, 'Notes cannot exceed 10,000 characters.').optional().nullable(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed.')
    .optional()
    .default([]),
  branchUrls: z
    .array(
      z.string().trim().refine((url) => validateChatGPTUrl(url).isValid, {
        message: 'Branch URL must be a valid HTTPS ChatGPT link.',
      }),
    )
    .max(50, 'Maximum 50 branch URLs allowed.')
    .optional(),
  passCount: z
    .number()
    .int('Pass count must be a whole number.')
    .nonnegative('Pass count cannot be negative.')
    .optional()
    .nullable(),
  failCount: z
    .number()
    .int('Fail count must be a whole number.')
    .nonnegative('Fail count cannot be negative.')
    .optional()
    .nullable(),
  practicedAt: z
    .string()
    .datetime({ message: 'Practiced date must be a valid ISO 8601 timestamp.' })
    .optional()
    .nullable(),
});

export const updateSessionSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, 'Topic cannot be empty.')
    .max(255, 'Topic must be 255 characters or fewer.')
    .optional(),
  chatgptUrl: z
    .string()
    .trim()
    .refine((url) => validateChatGPTUrl(url).isValid, {
      message:
        'Please enter a valid, official HTTPS ChatGPT link (e.g. https://chatgpt.com/c/...)',
    })
    .optional(),
  status: sessionStatusSchema.optional(),
  notes: z.string().max(10000, 'Notes cannot exceed 10,000 characters.').optional().nullable(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed.')
    .optional(),
  branchUrls: z
    .array(
      z.string().trim().refine((url) => validateChatGPTUrl(url).isValid, {
        message: 'Branch URL must be a valid HTTPS ChatGPT link.',
      }),
    )
    .max(50, 'Maximum 50 branch URLs allowed.')
    .optional(),
  passCount: z
    .number()
    .int('Pass count must be a whole number.')
    .nonnegative('Pass count cannot be negative.')
    .optional()
    .nullable(),
  failCount: z
    .number()
    .int('Fail count must be a whole number.')
    .nonnegative('Fail count cannot be negative.')
    .optional()
    .nullable(),
  practicedAt: z
    .string()
    .datetime({ message: 'Practiced date must be a valid ISO 8601 timestamp.' })
    .optional()
    .nullable(),
});

export const recordResultSchema = z.object({
  passCount: z
    .number({ message: 'Pass count is required.' })
    .int('Pass count must be a whole integer.')
    .nonnegative('Pass count cannot be negative.'),
  failCount: z
    .number({ message: 'Fail count is required.' })
    .int('Fail count must be a whole integer.')
    .nonnegative('Fail count cannot be negative.'),
  practicedAt: z
    .string()
    .datetime({ message: 'Practiced date must be a valid ISO 8601 timestamp.' })
    .optional(),
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters.').optional().nullable(),
  chatgptUrl: z
    .string()
    .trim()
    .refine((url) => !url || validateChatGPTUrl(url).isValid, {
      message: 'Branch link must be a valid HTTPS ChatGPT link.',
    })
    .optional()
    .nullable(),
  markCompleted: z.boolean().optional().default(true),
});

export const createAttemptSchema = z.object({
  passCount: z
    .number({ message: 'Pass count is required.' })
    .int('Pass count must be a whole integer.')
    .nonnegative('Pass count cannot be negative.'),
  failCount: z
    .number({ message: 'Fail count is required.' })
    .int('Fail count must be a whole integer.')
    .nonnegative('Fail count cannot be negative.'),
  practicedAt: z
    .string()
    .datetime({ message: 'Practiced date must be a valid ISO 8601 timestamp.' })
    .optional(),
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters.').optional().nullable(),
  chatgptUrl: z
    .string()
    .trim()
    .refine((url) => !url || validateChatGPTUrl(url).isValid, {
      message: 'ChatGPT link must be a valid HTTPS ChatGPT link.',
    })
    .optional()
    .nullable(),
  markCompleted: z.boolean().optional().default(true),
});

export const updateAttemptSchema = z.object({
  passCount: z
    .number()
    .int('Pass count must be a whole integer.')
    .nonnegative('Pass count cannot be negative.')
    .optional(),
  failCount: z
    .number()
    .int('Fail count must be a whole integer.')
    .nonnegative('Fail count cannot be negative.')
    .optional(),
  practicedAt: z
    .string()
    .datetime({ message: 'Practiced date must be a valid ISO 8601 timestamp.' })
    .optional()
    .nullable(),
  notes: z.string().max(5000, 'Notes cannot exceed 5,000 characters.').optional().nullable(),
  chatgptUrl: z
    .string()
    .trim()
    .refine((url) => !url || validateChatGPTUrl(url).isValid, {
      message: 'ChatGPT link must be a valid HTTPS ChatGPT link.',
    })
    .optional()
    .nullable(),
});

export const practiceAttemptImportSchema = z.object({
  passCount: z.number().int().nonnegative(),
  failCount: z.number().int().nonnegative(),
  score: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  chatgptUrl: z.string().optional().nullable(),
  practicedAt: z.string(),
  createdAt: z.string().optional().nullable(),
});

export const sessionImportItemSchema = z.object({
  topic: z.string().trim().min(1, 'Topic is required.'),
  chatgptUrl: z.string().trim().refine((url) => validateChatGPTUrl(url).isValid, {
    message: 'Valid HTTPS ChatGPT URL is required.',
  }),
  branchUrls: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  status: sessionStatusSchema.optional().default('PLANNED'),
  notes: z.string().optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  passCount: z.number().int().nonnegative().optional().nullable(),
  failCount: z.number().int().nonnegative().optional().nullable(),
  practicedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  attempts: z.array(practiceAttemptImportSchema).optional().nullable(),
});

export const importPayloadSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  sessions: z.array(sessionImportItemSchema, {
    message: 'Import file must contain a "sessions" array.',
  }),
  duplicateStrategy: z.enum(['skip', 'update', 'replace']).optional().default('skip'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type RecordResultInput = z.infer<typeof recordResultSchema>;
export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;
export type UpdateAttemptInput = z.infer<typeof updateAttemptSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
