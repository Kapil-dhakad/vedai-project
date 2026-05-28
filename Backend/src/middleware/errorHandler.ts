import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ Error [${statusCode}]: ${message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const err: ApiError = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export const createError = (message: string, statusCode: number): ApiError => {
  const err: ApiError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};
