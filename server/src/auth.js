import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const secret = process.env.JWT_SECRET || 'launchloop-super-secure-jwt-secret-2026';
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
}
