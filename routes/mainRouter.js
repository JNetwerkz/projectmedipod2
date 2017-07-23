const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')
const isLoggedIn = require('../middleware/isLoggedIn')

// route when you first land on web app
router.route('/')
.get(mainController.getLanding)

// route when posting log in details
router.route('/landing')
.get(mainController.getLanding)

router.route('/login')
.post(mainController.logIn)

// route for sign up page
router.route('/signup')
.get(mainController.getSignUp)
.post(mainController.signingup)

router.use(isLoggedIn)

// route to log out
router.route('/logout')
.get(mainController.logOut)

// route getting to creating event page
router.route('/eventcreate')
.get(mainController.createEvent)

module.exports = router
