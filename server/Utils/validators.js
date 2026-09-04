import ApiError from "./ApiError.js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (value) =>
  typeof value === "string" && EMAIL_PATTERN.test(value.trim());

const asString = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * Validates a request body against a tiny declarative spec and returns only
 * the declared fields, so nothing extra can reach the model.
 * spec: { field: { required, type: "email"|"string", min, max } }
 */
export const validateBody = (body, spec) => {
  const errors = {};
  const clean = {};

  for (const [field, rule] of Object.entries(spec)) {
    const raw = body?.[field];
    const value = rule.type === "email" ? asString(raw).toLowerCase() : asString(raw);

    if (!value) {
      if (rule.required) errors[field] = `${rule.label || field} is required`;
      continue;
    }
    if (rule.type === "email" && !isEmail(value)) {
      errors[field] = "Enter a valid email address";
      continue;
    }
    if (rule.min && value.length < rule.min) {
      errors[field] = `${rule.label || field} must be at least ${rule.min} characters`;
      continue;
    }
    if (rule.max && value.length > rule.max) {
      errors[field] = `${rule.label || field} must be at most ${rule.max} characters`;
      continue;
    }
    clean[field] = value;
  }

  if (Object.keys(errors).length) {
    throw ApiError.badRequest("Please check the highlighted fields", errors);
  }
  return clean;
};
