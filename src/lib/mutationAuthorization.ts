type ErrorLike = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
};

function getErrorText(error: unknown) {
  if (!error || typeof error !== 'object') {
    return String(error ?? '');
  }

  const candidate = error as ErrorLike;
  return [
    candidate.code,
    candidate.message,
    candidate.details,
    candidate.hint,
  ]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join(' ');
}

export class MutationAuthorizationError extends Error {
  cause: unknown;

  constructor(message = 'Mutation blocked by trusted backend authorization.', cause?: unknown) {
    super(message);
    this.name = 'MutationAuthorizationError';
    this.cause = cause;
  }
}

export function isMutationAuthorizationError(error: unknown) {
  if (error instanceof MutationAuthorizationError) {
    return true;
  }

  const text = getErrorText(error);
  return /42501|permission denied|row-level security|violates row-level security|forbidden|not authorized/i.test(text);
}

export function asMutationAuthorizationError(error: unknown) {
  if (error instanceof MutationAuthorizationError) {
    return error;
  }

  return new MutationAuthorizationError(undefined, error);
}
