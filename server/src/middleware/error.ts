import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof AppError) {
    return c.json(
      { error: err.code, message: err.message, ...(err.details && { details: err.details }) },
      err.status as 400
    );
  }

  return c.json(
    { error: "internal_error", message: "An unexpected error occurred" },
    500
  );
};

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(resource: string, id?: string): AppError {
  return new AppError(404, "not_found", `${resource} not found`, id ? { resourceId: id } : undefined);
}

export function forbidden(message = "Not authorized to perform this action"): AppError {
  return new AppError(403, "forbidden", message);
}

export function badRequest(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(400, "validation_error", message, details);
}

export function conflict(message: string): AppError {
  return new AppError(409, "conflict", message);
}
