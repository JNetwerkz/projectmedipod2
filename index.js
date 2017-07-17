const express = require('express')
const app = express()

// setting up dotenv for session and port
require('dotenv').config({ silent: true })

app.get('/', function (req, res) {
  res.send('hello brian')
})

// To make sure we are connected to heroku or localhost
app.listen(process.env.PORT, function () {
  console.log('express is running on port ')
})
