var User = require('../models/user')
var Event = require('../models/event')
var Customer = require('../models/customer')
var Promo = require('../models/promo')
var Code = require('../models/code')
var passport = require('../config/passport')
const voucherCodes = require('voucher-code-generator')
const nodemailer = require('nodemailer')
const moment = require('moment')
const async = require('async')
const crypto = require('crypto')
const _ = require('lodash')

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
      subname: req.body.subeventname,
      datefrom: req.body.datefrom,
      dateto: req.body.datetill,
      location: req.body.location,
      promo: req.body.promocheck
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
    res.render('./clinic', {clinic: req.user})
  },
  // Checking promo code
  verifyCode: function (req, res) {
    Code.find({ code: req.body.userpromo },
    function (err, check) {
      if (err) {
        req.flash('error', 'Not able to find code in database')
        res.redirect('/clinic')
      } else {
        if (check[0] === undefined) {
          req.flash('error', 'Not able to find code')
          return res.redirect('/clinic')
        } else if (Date.now() > check[0].dateexpires) {
          req.flash('error', 'Code has expired')
          return res.redirect('/clinic')
        } else if (check[0].is_redeemed) {
          console.log(check[0])
          req.flash('error', 'Code already redeemed')
          return res.redirect('/clinic')
        } else {
          Code.findOneAndUpdate({ code: req.body.userpromo }, { $set: { is_redeemed: true, dateredeemed: Date.now(), redeemed_by: req.user._id } }, { new: true },
            function (err, doc) {
              if (err) {
                req.flash('error', 'Not able to find code')
                res.redirect('/clinic')
              } else {
                req.flash('success', 'Code successfully redeemed')
                res.redirect('/clinic')
              }
            })
        }
      }
    })
  },
  // Attendee registeration form (road show) with redirect to expired link page with log out function
  rdShowSignUp: function (req, res) {
    Event.findById(req.params.id, function (err, event) {
      if (err) {
        req.flash('error', 'Not able to find event')
        return res.redirect('/')
      } else if (event === null) {
        res.render('./errorpage')
      } else {
        if (moment().format('DD MMM YYYY') <= moment(event.dateto).format('DD MMM YYYY')) {
          // req.logout()
          res.render('rdshow', {event: req.params})
        } else {
          res.render('./linkexpired')
        }
      }
    })
  },
  // Attendee registeration form (seminar) with redirect to expired link page with log out function
  seminarSignUp: function (req, res) {
    Event.findById(req.params.id, function (err, event) {
      if (err) {
        req.flash('error', 'Not able to find event')
        return res.redirect('/')
      } else {
        if (moment().format('DD MMM YYYY') <= moment(event.dateto).format('DD MMM YYYY')) {
          // req.logout()
          res.render('seminar', {event: req.params})
        } else {
          res.render('./linkexpired')
        }
      }
    })
  },
  // function when posting sign up form for customer
  signedUpRdShow: function (req, res) {
    var icString = req.body.ic.toUpperCase()
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
      ic: icString,
      event: req.params.id,
      pdpa_consent: req.body.pdpa,
      has_attended: true
    }, function (err, customer) {
      if (err) {
        req.flash('error', 'Customer Not Added')
        console.log(err)
        return res.redirect('back')
      }
      Event.findByIdAndUpdate(req.params.id, {$push: {attendees: customer.id}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Customer already added into event')
          return res.redirect('back')
        }
        req.flash('success', 'Customer Added')
        return res.redirect('back')
      })
    })
  },
  // function when posting sign up form for customer
  signedUpSeminar: function (req, res) {
    var icString = req.body.ic.toUpperCase()
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
      ic: icString,
      event: req.params.id,
      pdpa_consent: req.body.pdpa
    }, function (err, customer) {
      if (err) {
        req.flash('error', 'Customer Not Added')
        console.log(err)
        return res.redirect('back')
      }
      Event.findByIdAndUpdate(req.params.id, {$push: {attendees: customer.id}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Customer already added into event')
          return res.redirect('back')
        }
        req.flash('success', 'Customer Added')
        return res.redirect('back')
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
        if (moment(event.dateto).format('DD MMM YYYY') >= moment().format('DD MMM YYYY')) {
          nameevent = event.name
        }
      })
      res.render('eventindex', {list: nameevent, events: listevent, moment: moment})
    })
  },
  // when admin chooses a listed event and to generate promocode
  chosenEvent: function (req, res) {
    // find all customers
    var eventId = req.params.id
    Event.findById(eventId)
    .populate({
      path: 'attendees',
      model: 'Customer'
    })
    .populate({
      path: 'promo',
      model: 'Promo'
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
        // checking for duplicates
        Customer.aggregate([
          {$group: {
            _id: {ic: '$ic'},
            uniqueIds: {$addToSet: '$_id'},
            firstnames: {$addToSet: '$firstname'},
            lastnames: {$addToSet: '$lastname'},
            event: {$addToSet: '$event'},
            count: {$sum: 1}
          }},
          {$match: {
            // FIND IF EVENT INCLUDES eventID<---
            count: {'$gt': 1}
          }}
        ], function (err, duplicates) {
          if (err) {
            req.flash('error', 'Unable to vet through list')
          } else {
            // console.log(duplicates)
            // console.log(duplicates[0].uniqueIds[0])
            // console.log(duplicates[0]._id.ic)
            let duplicatesIc = duplicates.map(person => {
              return person._id.ic
            })
            // console.log(duplicatesIc)
            // console.log('--->', customers.attendees)
            let arrayOfCustomerIcs = customers.attendees.map(customer => {
              return customer.ic
            })
            let dups = duplicates.filter(duplicate => {
              if (arrayOfCustomerIcs.includes(duplicate._id.ic)) {
                return duplicate
              }
            })
            res.render('chosenevent', {list: customers.attendees, promo: customers.promo, dups: dups, eventId: eventId, dupsIc: duplicatesIc})
          }
        })
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
      res.render('advisoreventindex', {events: events, moment: moment})
    })
  },
  // advisor to mark who attended the seminar after signing up online
  eventAttendance: function (req, res) {
    res.render('./eventattendance')
  },
  // get promotions create page
  getPromotionCreate: function (req, res) {
    User.find({has_roles: 'clinic'}, function (err, clinic) {
      if (err) {
        req.flash('error', 'Not able to to populate clinics')
        res.redirect('/attendee')
      }
      res.render('promotioncreate', {clinics: clinic})
    })
  },
  // post route to create promotions
  promotionsCreate: function (req, res) {
    Promo.create({
      name: req.body.namepromo,
      promocodeprefix: req.body.codeprefix.toUpperCase(),
      agencyprefix: req.body.agencyprefix.toUpperCase(),
      validity: req.body.validdate,
      clinic: req.body.clinic
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
      has_roles: 'clinic',
      name: req.body.clinicname,
      contact_number: req.body.number,
      address1: req.body.clinicadd1,
      address2: req.body.clinicadd2,
      postalcode: req.body.postalcode
    }, function (err, createdclinic) {
      if (err) {
        req.flash('error', 'Duplicate clinic found')
        return res.redirect('/admin/createclinic')
      } else {
        console.log(createdclinic)
        req.flash('success', 'Created Clinic account')
        return res.redirect('/admin/createclinic')
      }
    })
  },
  // Generating code for customer
  allPick: function (req, res) {
    var alllist = req.body.allpk
    // Creating code when multiple attendees are chosen
    if (Array.isArray(alllist)) {
      alllist.forEach(function (ea, i) {
        Promo.findByIdAndUpdate(req.body.promos, {$push: {attendees: ea}}, function (err, updatedData) {
          if (err) {
            req.flash('error', 'Not able to find Promo')
            return res.redirect('/admin')
          } else {
            console.log(updatedData)
            var code = voucherCodes.generate({
              prefix: updatedData.promocodeprefix,
              postfix: updatedData.agencyprefix,
              length: 5,
              charset: voucherCodes.charset('alphanumeric')
            })
            var expires = new Date()
            expires = expires.setDate(expires.getDate() + updatedData.validity)
            Code.create({
              code: code,
              attendee: alllist[i],
              dateexpires: expires,
              clinic: updatedData.clinic[0],
              event: req.params.id
            }, function (err, codeUpdate) {
              if (err) {
                console.log(err)
              }
              console.log('codeUpdate', codeUpdate)
              const options = [
                {
                  path: 'attendee', model: 'Customer'
                },
                {
                  path: 'clinic'
                },
                {
                  path: 'event'
                }
              ]

              Code.populate(codeUpdate, options, (err, foundCode) => {
                if (err) console.error('error', err)
                console.log('populated Code', foundCode)
                mailer(code, updatedData, foundCode)
              })
            })
          }
        })
      })
      req.flash('success', 'Code Created')
      return res.redirect('/admin')
    } else {
      // creating code for single chosen attendees only
      Promo.findByIdAndUpdate(req.body.promos, {$push: {attendees: req.body.allpk}}, function (err, updatedData) {
        if (err) {
          req.flash('error', 'Not able to find Promo')
          return res.redirect('/admin')
        } else {
          var code = voucherCodes.generate({
            prefix: updatedData.promocodeprefix,
            postfix: updatedData.agencyprefix,
            length: 5,
            charset: voucherCodes.charset('alphanumeric')
          })
          var expires = new Date()
          expires = expires.setDate(expires.getDate() + updatedData.validity)
          Code.create({
            code: code,
            attendee: req.body.allpk,
            dateexpires: expires,
            clinic: updatedData.clinic[0],
            event: req.params.id
          }, function (err, codeUpdate) {
            if (err) {
              console.log(err)
            } else {
              const options = [
                {
                  path: 'attendee', model: 'Customer'
                },
                {
                  path: 'clinic'
                },
                {
                  path: 'event'
                }
              ]

              Code.populate(codeUpdate, options, (err, foundCode) => {
                if (err) console.error('error', err)
                console.log('populated Code', foundCode)
                mailer(code, updatedData, foundCode)
              })
            }
          })
          req.flash('success', 'Code Created')
          return res.redirect('/admin')
        }
      })
    }
  },
  // admin checking which clinic has redeemed what codes
  clinicRedeem: function (req, res) {
    User.find({has_roles: 'clinic'}, function (err, clinics) {
      if (err) {
        req.flash('error', 'Cannot populate clincs')
        return res.redirect('/attendee')
      } else {
        Code.aggregate([
          {$group: {
            _id: {redeemed_by: '$redeemed_by'},
            attendee: {$addToSet: '$attendee'},
            code: {$addToSet: '$code'},
            count: {$sum: 1}
          }},
          {$match: {
            count: {'$gt': 1}
          }},
          {$sort: {
            _id: 1
          }}
        ], function (err, clinicgrp) {
          if (err) {
            req.flash('error', 'Unable to vet through list')
          } else {
            console.log(clinicgrp)
            console.log(clinics)
            res.render('clinicredeem', {clinics: clinics, clinicgrp: clinicgrp})
          }
        })
      }
    })
  },
  // Admin delete event feature
  rmvEvent: function (req, res, next) {
    Event.findByIdAndRemove(req.params.id, function (err, remove) {
      if (err) {
        req.flash('error', 'Unable to delete event')
        res.redirect('/admin')
      }
      req.flash('success', 'Successfully deleted event')
      res.redirect('/admin')
    })
  },
  // Admin edit event form (render)
  editEventForm: function (req, res) {
    Event.findById(req.params.id, function (err, event) {
      if (err) {
        req.flash('error', 'Unable to find event')
        res.redirect('/admin')
      } else {
        Event.findById(req.params.id)
        .populate({
          path: 'promo',
          model: 'Promo'
        })
        .exec(function (err, promo) {
          if (err) {
            res.redirect('./admin')
          }
          res.render('editevent', {event: event, datefrom: moment(event.datefrom).format('YYYY-MM-DD'), dateto: moment(event.dateto).format('YYYY-MM-DD'), promo: promo.promo[0]})
        })
      }
    })
  },
  // Admin editting event (put route)
  editingEvent: function (req, res) {
    var updates = {
      name: req.body.eventname,
      subname: req.body.subeventname,
      datefrom: req.body.datefrom,
      dateto: req.body.datetill,
      location: req.body.location
    }
    Event.findByIdAndUpdate(req.params.id, updates, function (err, updated) {
      if (err) {
        req.flash('error', 'Cannot update event')
        return res.redirect('/eventindex')
      } else {
        req.flash('success', 'Updated Event')
        res.redirect('/admin')
      }
    })
  },
  // 404 page for non-existent pages or wrong urls
  errorPage: function (req, res) {
    res.render('./errorpage')
  },
  // index page for all promos
  promoIndex: function (req, res) {
    Promo.find({}, function (err, promos) {
      if (err) {
        req.flash('error', 'Could not find promotions')
        res.redirect('/admin')
      }
    })
    .populate({
      path: 'clinic',
      model: 'User'
    })
    .exec(function (err, promos) {
      if (err) {
        req.flash('error', 'Could not find promotions')
        res.redirect('/admin')
      } else {
        res.render('promoindex', {promos: promos})
      }
    })
  },
  // admin delete promotion function
  rmvPromo: function (req, res) {
    Promo.findByIdAndRemove(req.params.id, function (err, remove) {
      if (err) {
        console.log(err)
        req.flash('error', 'Unable to delete promotion')
        res.redirect('/admin/promotion')
      }
      req.flash('success', 'Successfully deleted promotion')
      res.redirect('/admin/promotion')
    })
  },
  // edit promo page (rendering)
  editPromo: function (req, res) {
    Promo.findById(req.params.id, function (err, promo) {
      if (err) {
        req.flash('error', 'Unable to find Promotion')
        res.redirect('/admin')
      } else {
        Promo.findById(req.params.id)
        .populate({
          path: 'clinic',
          model: 'User'
        })
        .exec(function (err, promo) {
          if (err) {
            res.redirect('./admin')
          }
          res.render('editpromo', {promo: promo, clinic: promo.clinic[0], name: promo.name})
        })
      }
    })
  },
  // Admin editting event (put route)
  editingPromo: function (req, res) {
    var updates = {
      name: req.body.namepromo,
      agencyprefix: req.body.codeprefix,
      promocodeprefix: req.body.agencyprefix,
      validity: req.body.validdate
    }
    Promo.findByIdAndUpdate(req.params.id, updates, function (err, updated) {
      if (err) {
        req.flash('error', 'Cannot update promotion')
        return res.redirect('/admin/promotion')
      } else {
        req.flash('success', 'Updated promotion')
        res.redirect('/admin/promotion')
      }
    })
  },
  // Index page for all clinics
  clinicIndex: function (req, res) {
    User.find({has_roles: 'clinic'}, function (err, clinic) {
      if (err) {
        req.flash('error', 'Not able to find clinics')
        res.redirect('/attendee')
      }
      res.render('clinicindex', {clinics: clinic})
    })
  },
  // Deleting clinic
  rmvClinic: function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, remove) {
      if (err) {
        console.log(err)
        req.flash('error', 'Unable to delete clinic')
        res.redirect('/admin/clinic')
      }
      req.flash('success', 'Successfully deleted clinic')
      res.redirect('/admin/clinic')
    })
  },
  // Editing clinic
  editClinic: function (req, res) {
    User.findById(req.params.id, function (err, clinic) {
      if (err) {
        req.flash('error', 'Unable to find Promotion')
        res.redirect('/admin')
      } else {
        res.render('editclinic', {clinic: clinic})
      }
    })
  },
  // Admin editting clinic (put route)
  editingClinic: function (req, res) {
    var updates = {
      name: req.body.clinicname,
      contact_number: req.body.number,
      address1: req.body.clinicadd1,
      address2: req.body.clinicadd2,
      postalcode: req.body.postalcode
    }
    User.findByIdAndUpdate(req.params.id, updates, function (err, updated) {
      if (err) {
        req.flash('error', 'Cannot update clinic')
        return res.redirect('/admin/clinic')
      } else {
        req.flash('success', 'Updated clinic')
        res.redirect('/admin/clinic')
      }
    })
  },
  // Forgot password page (render)
  forgotPassword: function (req, res) {
    res.render('./forgot')
  },
  // Resetting password for user
  resettingPassword: function (req, res, next) {
    async.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex')
          done(err, token)
        })
      },
      function (token, done) {
        User.findOne({email: req.body.email}, function (err, user) {
          if (!user || err) {
            req.flash('error', 'No account with that email address exists')
            return res.redirect('/forgot')
          }
          user.resetPasswordToken = token
          user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

          user.save(function (err) {
            done(err, token, user)
          })
        })
      },
      function (token, user, done) {
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.CLIENT_EMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
          }
        })
        const HelperOptions = {
          from: 'Medipod <medipod.master@gmail.com>',
          to: req.body.email,
          subject: `Medipod Password Reset`,
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }
        smtpTransport.sendMail(HelperOptions, (err, info) => {
          if (err) {
            console.log('sendmail error', err)
            return res.redirect('/forgot')
          }
          req.flash('success', 'An e-mail has been sent to ' + req.body.email + ' with further instructions.')
          res.redirect('/')
        })
      }
    ], function (err) {
      if (err) return next(err)
      res.redirect('/')
    })
  },
  // reset password page (render)
  resetPage: function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
      if (!user || err) {
        req.flash('error', 'Password reset token is invalid or has expired.')
        return res.redirect('/forgot')
      }
      res.render('reset', {token: req.params.token})
    })
  },
  // sending confirmation email and saving new password
  confirmation: function (req, res) {
    async.waterfall([
      function (done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
          if (!user || err) {
            req.flash('error', 'Password reset token is invalid or has expired.')
            return res.redirect('back')
          }
          if (req.body.password === req.body.confirm) {
            user.password = req.body.password
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined
            user.save(function (err) {
              if (err) {
                req.flash('error', 'Unable to save new password')
                return res.redirect('back')
              }
              req.logIn(user, function (err) {
                done(err, user)
              })
            })
          } else {
            req.flash('error', 'Passwords do not match.')
            return res.redirect('back')
          }
        })
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.CLIENT_EMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
          }
        })
        var mailOptions = {
          to: user.email,
          from: 'Medipod <medipod.master@gmail.com>',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
           'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        }
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('success', 'Success! Your password has been changed.')
          done(err)
        })
      }
    ], function (err) {
      if (err) return res.redirect('/')
      res.redirect('/')
    })
  }
}
module.exports = mainController

// Nodemailer script
function mailer (code, promoData, codeData) {
  const {
    name: promoName
  } = promoData

  const {
    attendee,
    event,
    clinic,
    dateexpires
  } = codeData

  const momentDateExpires = moment(dateexpires).format('DD MMM YYYY')

  const {
    firstname,
    lastname,
    title,
    email
  } = attendee[0]

  const {
    name: eventName
  } = event[0]

  const {
    name: clinicName,
    address1: clinicAddress1,
    address2: clinicAddress2,
    postalcode: clinicPostal,
    contact_number: clinicContactNumber
  } = clinic[0]

  console.log('creating transport')
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.CLIENT_EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  })

  const HelperOptions = {
    from: 'Medipod <medipod.master@gmail.com>',
    to: email,
    subject: `Promo Code for ${promoName} Event`,
    // text: 'Dear ' + customer.firstname + ' ' + customer.lastname + ',' + ' thank you for registering for our event. Your Promo code is ' + code
    html: ` <p>Dear ${title}. ${firstname} ${lastname},</p>
            <br />
            <p>Thank you for registering for our ${eventName} event.</p>
            <p>You are entitled to a ${promoName}, valid till ${momentDateExpires}</p>
            <br />
            <p>Kindly contact the clinic to fix an appointment.</p>
            <p><strong>${clinicName}</strong></p>
            <p>${clinicAddress1}</p>
            <p>${clinicAddress2}</p>
            <p>${clinicPostal}</p>
            <p>${clinicContactNumber}</p>
            <br />
            <p>Your Promo Code is <span style="font-size: 1.5em; font-weight: bold">${code}</span></p>
            <br />
            <p><i>Sincerely,</i></p>
            <p>Medipod</p>
          `
  }
  console.log('sending mail')
  transporter.sendMail(HelperOptions, (err, info) => {
    if (err) {
      return console.log('sendmail error', err)
    }
    console.log('sendmail info', info)
    console.log('Message sent')
    toggle(attendee)
  })
}

// Toggling has_attended on customer schema to true after creating code
function toggle (attendee) {
  Customer.findByIdAndUpdate(attendee._id, {$set: {has_code: true}}, function (err, updateData) {
    if (err) {
      console.log(err)
    }
  })
}
