function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  res.redirect('/users/login');
}

function ensureGuest(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/assignments/my');
  }

  next();
}

module.exports = {
  ensureAuthenticated,
  ensureGuest
};