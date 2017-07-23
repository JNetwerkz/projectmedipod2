var User = require('../models/user')
var passport = require('../config/passport')

const mainController = {
  getLanding: function (req, res) {
    res.render('./landing')
  },
  signingup: function (req, res, next) {
    res.locals.userData = req.body
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('error', 'Password does not Match')
      res.redirect('/signup')
      return
    }
    // creating admins
    User.create({
      email: req.body.email,
      password: req.body.password
    }, function (err, createdUser) {
      if (err) {
        req.flash('error', 'Could not create user account')
        res.redirect('/signup')
      } else {
        passport.authenticate('local', {
          successRedirect: '/eventcreate',
          successFlash: 'Account created and logged in'
        })(req, res)
      }
    })
  },
  createEvent: function (req, res) {
    res.render('./eventcreate')
  },
  getSignUp: function (req, res) {
    res.render('./signup')
  },
  logIn: function (req, res) {
    passport.authenticate('local', {
      successRedirect: '/eventcreate',
      failureRedirect: '/landing',
      failureFlash: 'Invalid username and/or password',
      successFlash: 'You have logged in'
    })(req, res)
  },
  logOut: function (req, res) {
    req.logout()
    req.flash('success', 'You have logged out')
    res.redirect('/')
  }
}
module.exports = mainController
