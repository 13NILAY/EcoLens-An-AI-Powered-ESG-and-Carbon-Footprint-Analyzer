const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next(); // allow request to continue
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
module.exports = { authenticate,authorizeRoles };
