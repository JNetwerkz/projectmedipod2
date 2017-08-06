var User = require('../models/user')
var Event = require('../models/event')
var Customer = require('../models/customer')
var Promo = require('../models/promo')
var Code = require('../models/code')
var passport = require('../config/passport')
const voucherCodes = require('voucher-code-generator')

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
    Promo.find({}, function (err, promo) {
      if (err) {
        req.flash('error', 'Can\'t get promotion list')
        res.redirect('/eventindex')
      }
      res.render('eventcreate', {promos: promo})
    })
  },
  // posting create event form and creating event
  createPromo: function (req, res) {
    Event.create({
      name: req.body.eventname,
      datefrom: req.body.datefrom,
      dateto: req.body.datetill,
      location: req.body.location
    }, function (err, event) {
      if (err) {
        req.flash('error', 'Event Not Added')
        return res.redirect('/admin')
      }
      // inserting events to current user
      User.findByIdAndUpdate(req.user._id, {$push: {event: event.id}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Event Already Added')
          return res.redirect('/admin')
        }
        // inserting promo to event
        if (req.body.promocheck.length === 24) {
          Event.findByIdAndUpdate(event.id, {$push: {promo: req.body.promocheck}}, function (err, updatedData) {
            if (err) {
              req.flash('error', 'Not able to add promo')
              return res.redirect('/admin')
            }
            req.flash('success', 'Event Added')
            return res.redirect('/admin')
          })
        } else {
          Event.findByIdAndUpdate(event.id, {$push: {promo: {$each: req.body.promocheck}}}, function (err, updatedData) {
            if (err) {
              req.flash('error', 'Not able to add promo')
              return res.redirect('/admin')
            }
            req.flash('success', 'Event Added')
            return res.redirect('/admin')
          })
        }
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
  // Logout controls
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
    Code.find({ code: req.body.userpromo },
    function (err, check) {
      if (err) {
        req.flash('error', 'Not able to find code in database')
        res.redirect('/clinic')
      } else {
        if (check[0].is_redeemed) {
          req.flash('error', 'Code already redeemed')
          res.redirect('/clinic')
        } else {
          Code.findOneAndUpdate({ code: req.body.userpromo }, { $set: { is_redeemed: true, dateredeemed: req.body.dateused } }, { new: true },
            function (err, doc) {
              if (err) {
                req.flash('error', 'Not able to find code in database')
                res.redirect('/clinic')
              } else {
                req.flash('success', 'Code successfully redeemed')
                res.redirect('./clinic')
              }
            })
        }
      }
    })
  },
  // Attendee registeration form (road show)
  rdShowSignUp: function (req, res) {
    res.render('rdshow', {event: req.params})
  },
  // function when posting sign up form for customer
  signedUpRdShow: function (req, res) {
    Customer.create({
      title: req.body.title,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      address1: req.body.address1,
      address2: req.body.address2,
      postalcode: req.body.postalcode,
      contactno: req.body.contactno,
      email: req.body.email,
      dob: req.body.dob,
      ic: req.body.ic
    }, function (err, customer) {
      if (err) {
        req.flash('error', 'Customer Not Added')
        console.log(err)
        return res.redirect('/attendee')
      }
      Event.findByIdAndUpdate(req.params.id, {$push: {attendees: customer.id}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Customer already added into event')
          return res.redirect('/attendee')
        }
        req.flash('success', 'Customer Added')
        return res.redirect('/attendee')
      })
    })
  },
  // populating index page of all events past and current
  attendanceList: function (req, res) {
    User.findById(req.user._id)
    .populate({
      path: 'event',
      model: 'Event'
    })
    .exec(function (err, events) {
      var nameevent = ''
      let listevent = events.event
      if (err) {
        req.flash('error', 'Can\'t populate events list')
        console.log(err)
        return res.redirect('/')
      }
      listevent.forEach(function (event, i) {
        if (event.dateto > Date.now()) {
          nameevent = event.name
        }
      })
      res.render('eventindex', {list: nameevent, events: listevent})
    })
  },
  // when admin chooses a listed event and to generate promocode
  chosenEvent: function (req, res) {
    // find all customers
    Event.findById(req.params.id)
    .populate({
      path: 'attendees',
      model: 'Customer'
    })
    .exec(function (err, customers) {
      if (err) {
        console.log(err)
        return res.redirect('/admin')
      }
      Promo.find({}, function (err, promo) {
        if (err) {
          req.flash('error', 'Can\'t get promotion list')
          res.redirect('/eventindex')
        }
        res.render('chosenevent', {list: customers.attendees, promo: promo})
      })
    })
  },
  // advisor to choose event to create a sign up form
  advisorEventIndex: function (req, res) {
    Event.find({}, function (err, events) {
      if (err) {
        req.flash('error', 'Can\'t populate events list')
        res.redirect('/attendee')
      }
      res.render('advisoreventindex', {events: events})
    })
  },
  // generate promocode for user (KIV changed schema)
  CodeGenerate: function (req, res) {
    console.log(req.params)
    var code = voucherCodes.generate({
      prefix: 'AB',
      postfix: 'CD',
      length: 5,
      charset: voucherCodes.charset('alphanumeric')
    })
    console.log(code)
    Code.create({
      code: code,
      attendee: req.params.id
    }, function (err, code) {
      if (err) {
        console.log(err)
        req.flash('error', 'Code not created')
      }
      req.flash('success', 'code made')
      return res.redirect('/admin')
    })
  },
  // get promotions create page
  getPromotionCreate: function (req, res) {
    res.render('./promotioncreate')
  },
  // post route to create promotions
  promotionsCreate: function (req, res) {
    Promo.create({
      name: req.body.namepromo,
      promocodeprefix: req.body.codeprefix.toUpperCase(),
      agencyprefix: req.body.agencyprefix.toUpperCase(),
      validity: req.body.validdate
    }, function (err, code) {
      if (err) {
        req.flash('error', 'Promotion can\'t be created')
        return res.redirect('/admin/promotioncreate')
      }
      req.flash('success', 'Promotion Created')
      return res.redirect('/admin/promotioncreate')
    })
  },
  // rendering create clinic form page
  createclinic: function (req, res) {
    res.render('./createclinic')
  },
  // creating clinic with post route
  creatingclinic: function (req, res) {
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('error', 'Password does not Match')
      res.redirect('/admin/createclinic')
      return
    }
    // creating clinic account
    User.create({
      email: req.body.email,
      password: req.body.password,
      has_roles: 'clinic'
    }, function (err, createdclinic) {
      if (err) {
        req.flash('error', 'Unable to create clinic')
        return res.redirect('/admin/createclinic')
      } else {
        console.log(createdclinic)
        req.flash('success', 'Created Clinic account')
        return res.redirect('/admin/createclinic')
      }
    })
  }
}
module.exports = mainController
