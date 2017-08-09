module.exports = function (req, res, next) {
  if (req.user.has_roles === 'advisor' || req.user.has_roles === 'admin') {
    next()
  } else {
    req.flash('error', 'You must be advisor user to access that page')
    res.redirect('/')
  }
}
