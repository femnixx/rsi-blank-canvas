import jwt from "jsonwebtoken";

/**
 * Verify JWT from Authorization header. UC-SP-01.
 * [PROPOSED] standardized error shape with `code`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ code: "FORBIDDEN", message: "Unauthorized: missing token" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ code: "FORBIDDEN", message: "Unauthorized: invalid or expired token" });
  }
}
