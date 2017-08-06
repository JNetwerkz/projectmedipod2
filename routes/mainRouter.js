const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')
const isLoggedIn = require('../middleware/isLoggedIn')

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

// route getting to creating event index page
router.route('/admin')
.get(mainController.attendanceList)

// route for creating events
router.route('/admin/createevent')
.get(mainController.createEvent)
.post(mainController.createPromo)

// route for post to create promotion in /createevent page
router.route('/admin/promotioncreate')
.get(mainController.getPromotionCreate)
.post(mainController.promotionsCreate)

// route to check for promo
router.route('/admin/createclinic')
.get(mainController.createclinic)
.post(mainController.creatingclinic)

// route for chosen event to generate code for attendees
router.route('/admin/:id')
.get(mainController.chosenEvent)
.post(mainController.CodeGenerate)

// route for clinic to verify code
router.route('/clinic')
.get(mainController.clinicVerify)
.post(mainController.verifyCode)

// route for advisor to see event index
router.route('/attendee')
.get(mainController.advisorEventIndex)

// route for road show sign up form
router.route('/attendee/:id')
.get(mainController.rdShowSignUp)
.post(mainController.signedUpRdShow)

// route for all pick on attendees
router.route('/allpick')
.post(mainController.allPick)

module.exports = router
