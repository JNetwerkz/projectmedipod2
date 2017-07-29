const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')
const isLoggedIn = require('../middleware/isLoggedIn')

// // route when you first land on web app
// router.route('/')
// .get(mainController.getLanding)

// route when posting log in details
// router.route('/landing')
// .get(mainController.getLanding)

router.route('/login')
.post(mainController.logIn)

// route for sign up page
router.route('/signup')
.get(mainController.getSignUp)
.post(mainController.signingup)

// Authentication wall everything below is locked out.
router.use(isLoggedIn)

// route to log out
router.route('/logout')
.get(mainController.logOut)

// route getting to creating event page
router.route('/admin')
// .get(mainController.createEvent)
// .post(mainController.createPromo)
.get(mainController.AttendanceList)

// route for list of events for advisor/admin to choose from
router.route('/adminCreateEvent')
.get(mainController.createEvent)
.post(mainController.createPromo)

// route for clinic to verify code
router.route('/clinic')
.get(mainController.clinicVerify)
.post(mainController.verifyCode)

// route for road show sign up form
router.route('/attendee')
.get(mainController.rdShowSignUp)
.post(mainController.signedUpRdShow)

module.exports = router
