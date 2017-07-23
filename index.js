const express = require('express')
const bodyParser = require('body-parser')
const mainRouter = require('./routes/mainRouter')
const ejsLayout = require('express-ejs-layouts')
const session = require('express-session')
const passport = require('./config/passport')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const path = require('path')
const app = express()

// setting up dotenv for session and port
require('dotenv').config({ silent: true })

// mongoose and database set up
const dbURI = 'mongodb://localhost/medipod'
const mongoose = require('mongoose')
mongoose.connect(dbURI, {
  useMongoClient: true
})
mongoose.Promise = global.Promise

// setting up sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ url: dbURI })
}))

// initialize the passport configuration and session as middleware
app.use(passport.initialize())
app.use(passport.session())

// setting up flash
app.use(flash())
app.use(function (req, res, next) {
  // before every route, attach the flash messages and current user to res.locals
  res.locals.alerts = req.flash()
  res.locals.currentUser = req.user
  next()
})

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
