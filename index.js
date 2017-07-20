const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const mainRouter = require('./routes/mainRouter')
const ejsLayout = require('express-ejs-layouts')
const path = require('path')
const app = express()

// setting up dotenv for session and port
require('dotenv').config({ silent: true })

// mongoose and database set up
const dbURI = process.env.PROD_MONGODB || 'mongodb://localhost/medipod'
mongoose.createConnection(dbURI, function () {
  console.log('db is connected')
})
mongoose.Promise = global.Promise

// setting up bodyParser to use input forms
app.use(bodyParser.urlencoded({extended: false}))

// setting up the layout and template engine for express
app.set('view engine', 'ejs')
app.use(ejsLayout)
app.use(express.static(path.join(__dirname, 'assets')))

// setting up routes after auth wall
app.use('/', mainRouter)

// To make sure we are connected to heroku or localhost
app.listen(process.env.PORT, function () {
  console.log('express is running on port ')
})
