const express = require('express')
const router = express.Router()
const mainController = require('../controller/mainController')

// route when you first land on web app
router.route('/')
.get(mainController.getLanding)

module.exports = router
