module.exports = function (req, res, next) {
  if (req.user.has_roles === 'clinic' || req.user.has_roles === 'admin') {
    next()
  } else {
    req.flash('error', 'You must be clinic user to access that page')
    res.redirect('/')
  }
}
