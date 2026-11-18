const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID = { code: "INVALID_NIM", status: 422 };

export function string(opts = {}) {
  return { kind: "string", required: opts.required !== false, min: opts.min, max: opts.max, enum: opts.enum };
}

export function number(opts = {}) {
  return { kind: "number", required: opts.required !== false, min: opts.min, max: opts.max };
}

export function email(opts = {}) {
  return { kind: "email", required: opts.required !== false };
}

export function optional(schema) {
  return { kind: "optional", schema, required: false };
}

export function object(shape) {
  return { kind: "object", shape };
}

function checkType(value, rule) {
  if (rule.kind === "string") {
    if (typeof value !== "string") return { ok: false, msg: "must be a string" };
    if (rule.enum && !rule.enum.includes(value)) return { ok: false, msg: "must be one of " + rule.enum.join(", ") };
    if (rule.min !== undefined && value.length < rule.min) return { ok: false, msg: "must be at least " + rule.min + " characters" };
    if (rule.max !== undefined && value.length > rule.max) return { ok: false, msg: "must be at most " + rule.max + " characters" };
    return { ok: true };
  }
  if (rule.kind === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) return { ok: false, msg: "must be a number" };
    if (rule.min !== undefined && value < rule.min) return { ok: false, msg: "must be >= " + rule.min };
    if (rule.max !== undefined && value > rule.max) return { ok: false, msg: "must be <= " + rule.max };
    return { ok: true };
  }
  if (rule.kind === "email") {
    if (typeof value !== "string" || !EMAIL_RE.test(value)) return { ok: false, msg: "must be a valid email" };
    return { ok: true };
  }
  return { ok: true };
}

export function validate(schema, data) {
  const isRootObject = schema && schema.kind === "object";
  if (isRootObject) {
    const errors = [];
    const out = {};
    for (const [key, rule] of Object.entries(schema.shape)) {
      const value = data && typeof data === "object" ? data[key] : undefined;
      if (rule.kind === "optional") {
        if (value === undefined || value === null) continue;
        const inner = validate(rule.schema, { _: value });
        if (!inner.success) { errors.push({ field: key, ...inner.error }); continue; }
        out[key] = inner.data._;
        continue;
      }
      const required = rule.required !== false;
      if (value === undefined || value === null || value === "") {
        if (required) errors.push({ field: key, code: INVALID.code, message: key + " is required", status: INVALID.status });
        else out[key] = undefined;
        continue;
      }
      const c = checkType(value, rule);
      if (!c.ok) errors.push({ field: key, code: INVALID.code, message: key + " " + c.msg, status: INVALID.status });
      else out[key] = value;
    }
    if (errors.length) return { success: false, error: errors[0] };
    return { success: true, data: out };
  }
  const value = data && typeof data === "object" ? data._ : data;
  const c = checkType(value, schema);
  if (!c.ok) return { success: false, error: { code: INVALID.code, message: c.msg, status: INVALID.status } };
  return { success: true, data: { _: value } };
}

export function validateBody(schema) {
  return (req, res, next) => {
    const v = validate(schema, req.body);
    if (!v.success) return res.status(v.error.status || 422).json({ code: v.error.code, message: v.error.message, field: v.error.field });
    req.validated = v.data;
    next();
  };
}