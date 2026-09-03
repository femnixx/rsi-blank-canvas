/**
 * Admin guard middleware.
 * Requires requireAuth to have already run (attaches req.user).
 * Only allows users with role === 'admin' to proceed.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Admin privileges required." });
  }
  next();
}

/**
 * Student guard middleware.
 * Requires requireAuth to have already run (attaches req.user).
 * Only allows users with role === 'student' to proceed.
 */
export function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied: Student privileges required." });
  }
  next();
}
