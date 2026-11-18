export function domainError(code, message, status = 400) {
  const err = new Error(message || code);
  err.code = code;
  err.status = status;
  return err;
}

export const ERROR = {
  INVALID_NIM: { code: "INVALID_NIM", status: 422 },
  DUPLICATE_REGISTRATION: { code: "DUPLICATE_REGISTRATION", status: 409 },
  NOT_REGISTERED: { code: "NOT_REGISTERED", status: 404 },
  ALREADY_RECORDED: { code: "ALREADY_RECORDED", status: 409 },
  SESSION_NOT_ONGOING: { code: "SESSION_NOT_ONGOING", status: 409 },
  QUOTA_FULL: { code: "QUOTA_FULL", status: 409 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  FORBIDDEN_TIER: { code: "FORBIDDEN_TIER", status: 403 },
};

export function throwError(key, message) {
  const e = ERROR[key] || { code: key, status: 400 };
  throw domainError(e.code, message || e.code, e.status);
}
