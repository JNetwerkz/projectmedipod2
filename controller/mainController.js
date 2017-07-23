var User = require('../models/user')

const mainController = {
  getLanding: function (req, res) {
    res.render('./landing')
  },
  signingup: function (req, res, next) {
    res.locals.userData = req.body
    if (req.body.password !== req.body.confirmPassword) {
      console.log('no match on password')
    }
    // creating admins
    User.create({
      email: req.body.email,
      password: req.body.password
    }, function (err, createdUser) {
      if (err) {
        console.log('An error in creating user', err)
        res.redirect('/landing')
      } else {
        res.redirect('/eventcreate')
      }
    })
  },
  createevent: function (req, res) {
    res.render('./eventcreate')
  }
}
module.exports = mainController
