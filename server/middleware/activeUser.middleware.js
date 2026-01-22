// Active user check middleware
const checkUserActive = (req, res, next) => {
  if (req.user && req.user.status !== 'active') {
    return res.status(403).json({ 
      message: 'Account deactivated',
      details: 'Your account has been deactivated. Please contact the administrator.'
    });
  }
  next();
};

module.exports = {
  activeUser: checkUserActive,
};
