var User = require('../models/user')
var Event = require('../models/event')
var Customer = require('../models/customer')
var Promo = require('../models/promo')
var Code = require('../models/codes')
var passport = require('../config/passport')
const voucherCodes = require('voucher-code-generator')
// const async = require('async')

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
    Event.create({
      name: req.body.eventname,
      datefrom: req.body.datefrom,
      dateto: req.body.datetill,
      location: req.body.location
      // promocodeprefix: req.body.codeprefix,
      // agencyprefix: req.body.agencyprefix,
      // validity: req.body.validdate
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
    // place holder till there's a customer db
    // console.log('checking promo codes')
    res.send(req.body.userpromo)
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
      Event.findByIdAndUpdate(req.params.id, {$push: {attendee: customer.id}}, function (err, updatedData) {
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
      console.log(listevent)
      listevent.forEach(function (event, i) {
        if (event.dateto > Date.now()) {
          nameevent = event.name
          console.log(nameevent)
        } else {
          console.log('event passed')
        }
      })
      res.render('eventindex', {list: nameevent, events: listevent})
    })
  },
  // when admin chooses a listed event and to generate promocode
  // Issue of call back for repeatcustomerarray not getting sent to rendered page
  chosenEvent: function (req, res) {
    var repeatcustomerarray = []
    Customer.aggregate([
      {
        '$group': {
          '_id': { 'ic': '$ic' },
          'uniqueIds': { '$addToSet': '$_id' },
          'count': { '$sum': 1 }
        }
      },
    { '$match': { 'count': { '$gt': 1 } } }
    ], function (err, group) {
      if (err) {
        req.flash('error', 'Cannot vet through attendee list')
        req.redirect('/attendee')
      }
      var vettedcustomers = group[0].uniqueIds
      vettedcustomers.forEach(function (customer, i) {
        Customer.findById(customer, function (err, users) {
          if (err) {
            console.log(err)
            return
          }
          repeatcustomerarray.push(users)
          // console.log(repeatcustomerarray)
        })
      })
      // console.log(repeatcustomerarray)
      res.render('chosenevent', {vetted: vettedcustomers, vettedObjs: repeatcustomerarray})
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
    var code = voucherCodes.generate({
      prefix: 'AB',
      postfix: 'CD'
    })
    console.log(code)
    Code.create({
      name: 'Free Checkup',
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
  }
}
module.exports = mainController
