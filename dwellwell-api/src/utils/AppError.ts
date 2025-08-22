// dwellwell-api/src/utils/AppError.ts
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

// Sugar helpers (optional)
export const BadRequest = (code = 'BAD_REQUEST', message?: string, details?: unknown) =>
  new AppError(400, code, message, details);
export const Unauthorized = (code = 'UNAUTHORIZED', message?: string) =>
  new AppError(401, code, message);
export const Forbidden = (code = 'FORBIDDEN', message?: string) =>
  new AppError(403, code, message);
export const NotFound = (code = 'NOT_FOUND', message?: string) =>
  new AppError(404, code, message);
