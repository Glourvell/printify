const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/');
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next();
  }
  res.redirect('/dashboard');
};

module.exports = { isAuthenticated, isNotAuthenticated };
