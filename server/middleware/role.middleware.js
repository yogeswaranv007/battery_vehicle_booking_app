module.exports = function requireRole(required) {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized', details: 'User not authenticated' });
    }
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden', details: `Requires role: ${requiredRoles.join(', ')}` });
    }
    next();
  };
};
