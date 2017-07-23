const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')

// route when you first land on web app
router.route('/')
.get(mainController.getLanding)

// route when posting log in details
router.route('/landing')
.get(mainController.getLanding)
.post(mainController.logIn)

// route getting to creating event page
router.route('/eventcreate')
.get(mainController.createEvent)

// route for sign up page
router.route('/signup')
.get(mainController.getSignUp)
.post(mainController.signingup)

// route to log out
router.route('/logout')
.get(mainController.logOut)

module.exports = router
