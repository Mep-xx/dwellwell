// dwellwell-api/src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Known AppError
  if (err instanceof AppError) {
    const payload: any = { error: err.code, message: err.message };
    if (err.details) payload.details = err.details;
    return res.status(err.status).json(payload);
  }

  // Joi/Zod etc could surface here too — normalize as needed
  // Fallback 500
  console.error('[UNHANDLED_ERROR]', err);
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected error occurred.',
  });
};

// 404 "not found" for unmatched routes
export const notFoundHandler: ErrorRequestHandler = (_err, _req, res, _next) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
};
