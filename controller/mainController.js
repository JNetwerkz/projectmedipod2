var User = require('../models/user')
var Event = require('../models/event')
var passport = require('../config/passport')

const mainController = {

  // Rendering landing page
  getLanding: function (req, res) {
    res.render('./')
  },
  // Signing up controls
  signingup: function (req, res, next) {
    res.locals.userData = req.body
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('error', 'Password does not Match')
      res.redirect('/signup')
      return
    }
    // creating users
    User.create({
      email: req.body.email,
      password: req.body.password
    }, function (err, createdUser) {
      if (err) {
        req.flash('error', 'Could not create user account')
        res.redirect('/signup')
      } else {
        passport.authenticate('local', {
          successRedirect: '/admin',
          successFlash: 'Account created and logged in'
        })(req, res)
      }
    })
  },
  // rendering create event page
  createEvent: function (req, res) {
    res.render('./eventcreate')
  },
  // posting create event form and creating event
  createPromo: function (req, res) {
    // res.send(req.body)
    Event.create({
      name: req.body.eventname,
      datefrom: req.body.datefrom,
      dateto: req.body.datetill,
      location: req.body.location,
      promocodeprefix: req.body.codeprefix,
      agencyprefix: req.body.agencyprefix,
      validity: req.body.validdate
    }, function (err, event) {
      if (err) {
        req.flash('error', 'Event Not Added')
        return res.redirect('/admin')
      }
      User.findByIdAndUpdate(req.user._id, {$push: {event: event.id}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Event Already Added')
          return res.redirect('/admin')
        }
        req.flash('success', 'Event Added')
        return res.redirect('/admin')
      })
    })
  },
  // Rendering sign up page
  getSignUp: function (req, res) {
    res.render('./signup')
  },
  // Login controls
  logIn: function (req, res, next) {
    passport.authenticate('local', {
      successRedirect: '/admin',
      failureRedirect: '/',
      failureFlash: 'Invalid username and/or password',
      successFlash: 'You have logged in'
    })(req, res)
  },
  // Logout controlls
  logOut: function (req, res) {
    req.logout()
    req.flash('success', 'You have logged out')
    res.redirect('/')
  },
  // Rendering clinic verify promo page
  clinicVerify: function (req, res) {
    res.render('./clinic')
  },
  // Checking promo code
  verifyCode: function (req, res) {
    // place holder till there's a customer db
    console.log('checking promo codes')
    res.send(req.body.userpromo)
  },
  // Attendee registeration form (road show)
  rdShowSignUp: function (req, res) {
    res.render('./rdshow')
  }
}
module.exports = mainController
