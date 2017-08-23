var User = require('../models/user')
var Event = require('../models/event')
var Customer = require('../models/customer')
var Promo = require('../models/promo')
var Code = require('../models/code')
var passport = require('../config/passport')
const voucherCodes = require('voucher-code-generator')
const nodemailer = require('nodemailer')
const moment = require('moment')

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
        } else if (moment().format('DD MMM YYYY') > moment(check[0].dateexpires).format('DD MMM YYYY')) {
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
          // // if you log out user, advisor wont be able to render road show form (have to move these outside auth wall but beats the point of keeping it private)
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
          // // log out not needed here i think since if you are sending this as a link they wont be able to access routes after auth
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
    console.log(icString)
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
      ic: req.body.ic,
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
            count: {$sum: 1}
          }},
          {$match: {
            count: {'$gt': 1}
          }}
        ], function (err, duplicates) {
          if (err) {
            req.flash('error', 'Unable to vet through list')
          } else {
            console.log(customers)
            res.render('chosenevent', {list: customers.attendees, promo: promo, dups: duplicates, eventId: eventId})
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
      req.flash('success', 'Deleted event')
      res.redirect('/admin')
    })
  },
  // Admin edit event form (render)
  editEventForm: function (req, res) {
    Promo.find({}, function (err, promo) {
      if (err) {
        req.flash('error', 'Can\'t get promotion list')
        res.redirect('/eventindex')
      }
      res.render('editevent', {eventId: req.params.id, promos: promo})
    })
  },
  // Admin editting event (put route)
  editingEvent: function (req, res, next) {
    // only updating 3 fields
    if (req.body.eventname) {
      Event.findByIdAndUpdate(req.params.id, {$set: {name: req.body.eventname}}, function (err, updated) {
        if (err) next()
      })
      if (req.body.subeventname) {
        Event.findByIdAndUpdate(req.params.id, {$set: {subname: req.body.subeventname}}, function (err, updated) {
          if (err) next()
        })
        if (req.body.datefrom) {
          Event.findByIdAndUpdate(req.params.id, {$set: {datefrom: req.body.datefrom}}, function (err, updated) {
            if (err) next()
          })
          if (req.body.dateetill) {
            Event.findByIdAndUpdate(req.params.id, {$set: {dateto: req.body.dateetill}}, function (err, updated) {
              if (err) next()
            })
            if (req.body.location) {
              Event.findByIdAndUpdate(req.params.id, {$set: {location: req.body.location}}, function (err, updated) {
                if (err) next()
              })
              req.flash('success', 'Event Updated')
              res.redirect('/admin')
            }
          }
        }
      }
    }
    res.redirect('/admin')
  },
  // 404 page for non-existent pages or wrong urls
  errorPage: function (req, res) {
    res.render('./errorpage')
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
