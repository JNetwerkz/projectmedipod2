module.exports = function (req, res, next) {
  if (req.user.has_roles === 'clinic') {
    req.flash('success', 'Welcome Clinic User')
    res.redirect('/clinic')
    return
  } else if (req.user.has_roles === 'advisor') {
    req.flash('success', 'Welcome Advisor')
    res.redirect('/attendee')
    return
  } else {
    next()
  }
}
