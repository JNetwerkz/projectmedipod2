const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')
const isLoggedIn = require('../middleware/isLoggedIn')
const rolecheck = require('../middleware/rolecheck')
const isClinic = require('../middleware/isClinic')
const isAdvisor = require('../middleware/isAdvisor')

// Route for login
router.route('/login')
.post(mainController.logIn)

// route for sign up page
router.route('/signup')
.get(mainController.getSignUp)
.post(mainController.signingup)

// route for seminar sign up form (should we add in the log out function)
router.route('/attendee/seminar/:id')
.get(mainController.seminarSignUp)
.post(mainController.signedUpSeminar)

// route for road show sign up form (should we add in the log out function)
router.route('/attendee/roadshow/:id')
.get(mainController.rdShowSignUp)
.post(mainController.signedUpRdShow)

// Authentication wall everything below is locked out.
router.use(isLoggedIn)

// route for advisor to see event index
router.route('/attendee')
.get(isAdvisor, mainController.advisorEventIndex)

// route for advisor to see seminar event attendance list
router.route('/attendee/seminar/:id/attendance')
.get(isAdvisor, mainController.eventAttendance)

// route for clinic to verify code
router.route('/clinic')
.get(isClinic, mainController.clinicVerify)
.post(isClinic, mainController.verifyCode)

// route to log out
router.route('/logout')
.get(mainController.logOut)

// Checking of roles (Only admins able to access pages below)
router.use(rolecheck)

// route getting to creating event index page
router.route('/admin')
.get(mainController.attendanceList)

// route for creating events
router.route('/admin/createevent')
.get(mainController.createEvent)
.post(mainController.createPromo)

// route for showing all the current promos
router.route('/admin/promotion')
.get(mainController.promoIndex)

// route for deleting and editing promotion
router.route('/admin/promotion/:id')
.get(mainController.editPromo)
.delete(mainController.rmvPromo)

// route for post to create promotion in /createevent page
router.route('/admin/promotioncreate')
.get(mainController.getPromotionCreate)
.post(mainController.promotionsCreate)

// route to check for promo
router.route('/admin/createclinic')
.get(mainController.createclinic)
.post(mainController.creatingclinic)

// route for admin to check which clinic has redeemed which codes
router.route('/admin/clinicredeem')
.get(mainController.clinicRedeem)

// route for chosen event to generate code for attendees
router.route('/admin/:id')
.get(mainController.chosenEvent)
.delete(mainController.rmvEvent)

// Route for updating event
router.route('/admin/eventedit/:id')
.get(mainController.editEventForm)
.put(mainController.editingEvent)

// route for all pick on attendees
router.route('/allpick/:id')
.post(mainController.allPick)

// Route to catch all 404s
router.route('*')
.get(mainController.errorPage)

module.exports = router
