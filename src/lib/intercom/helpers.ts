export const DEFAULT_ERROR_MESSAGE = 'Unexpected error occurred';

export function serializeError(err: any) {
  const message = err?.message || DEFAULT_ERROR_MESSAGE;
  return Array.isArray(err?.errors) && err.errors.length > 0 ? [message, err.errors] : message;
}

export function deserializeError(data: any) {
  return Array.isArray(data) ? new IntercomError(data[0], data[1]) : new IntercomError(data);
}

export class IntercomError implements Error {
  name: string = 'IntercomError';

  constructor(public message: string, public errors?: any[]) {}
}
