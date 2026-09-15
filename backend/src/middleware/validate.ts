import { NextFunction, Request, Response } from "express";
import { validationResult, FieldValidationError } from "express-validator";

export interface FormattedValidationError {
  field?: string;
  message: string;
  msg: string;
  value?: unknown;
  location?: string;
}

export interface ValidationResponse {
  ok: false;
  code: "VALIDATION_ERROR";
  message: string;
  errors: FormattedValidationError[];
  fields: Record<string, string>;
}

/**
 * Extracts and formats errors from express-validator into a clean, client-friendly structure.
 */
export function formatValidationErrors(req: Request): ValidationResponse | null {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return null;
  }

  const rawErrors = result.array();
  const firstError = rawErrors[0];

  const fieldErrors: Record<string, string> = {};
  const formattedErrors: FormattedValidationError[] = rawErrors.map((err) => {
    const isField = (err as FieldValidationError).path !== undefined;
    const field = isField ? (err as FieldValidationError).path : undefined;
    const msg = err.msg || "Invalid input";

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = msg;
    }

    return {
      field,
      message: msg,
      msg, // Keep msg for backward compatibility
      value: isField ? (err as FieldValidationError).value : undefined,
      location: isField ? (err as FieldValidationError).location : undefined
    };
  });

  return {
    ok: false,
    code: "VALIDATION_ERROR",
    message: firstError.msg || "Please check the form for errors.",
    errors: formattedErrors,
    fields: fieldErrors
  };
}

/**
 * Middleware that halts request execution and responds with user-friendly validation errors if any exist.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errorResponse = formatValidationErrors(req);
  if (errorResponse) {
    return res.status(400).json(errorResponse);
  }
  return next();
}

