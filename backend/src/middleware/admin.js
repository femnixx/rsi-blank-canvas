/**
 * Student guard — requires requireAuth (attaches req.user from JWT).
 * [OVERRIDE] JWT payload uses domain identifiers (nim/admin_id) not legacy user.id.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Access denied: Admin privileges required." });
  }
  next();
}

export function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== "student" || !req.user.nim) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Access denied: Student privileges required." });
  }
  next();
}