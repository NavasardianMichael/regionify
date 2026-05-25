type ErrorWithCode = Error & { code?: string };

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Error) return (error as ErrorWithCode).code;
  return undefined;
}
