// dwellwell-api/src/middleware/validate.ts
import type { ZodSchema } from 'zod';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!parsed.success) {
    return next(
      new AppError(400, 'VALIDATION_FAILED', 'Invalid request', parsed.error.issues)
    );
  }

  // Optionally attach sanitized data somewhere (commented out by default):
  // (req as any).validated = parsed.data;

  next();
};
