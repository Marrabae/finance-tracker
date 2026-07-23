import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'unauthorized'
  | 'invalid_body'
  | 'validation_failed'
  | 'not_found'
  | 'server_error';

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  invalid_body: 400,
  validation_failed: 400,
  not_found: 404,
  server_error: 500,
};

/**
 * Uniform error envelope for /api/v1. `details` carries whatever helps a caller fix the
 * request from a phone — e.g. the list of category names that *would* have matched.
 */
export function apiError(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status: STATUS[code] }
  );
}
