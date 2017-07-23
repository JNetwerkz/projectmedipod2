const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')

// route when you first land on web app
router.route('/')
.get(mainController.getLanding)

// route when posting signup details
router.route('/landing')
.get(mainController.getLanding)
.post(mainController.signingup)

router.route('/eventcreate')
.get(mainController.createevent)

module.exports = router
