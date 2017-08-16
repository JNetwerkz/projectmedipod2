var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

// regex for email
var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/

// User Schema which consist of clinics, admins and sales advisor
var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: emailRegex
  },
  password: {
    type: String,
    required: true,
    minlength: [3, 'password must be at minimum 3 characters'],
    maxlength: [99, 'password cannot be more than 99 characters']
  },
  has_roles: {
    type: String,
    enum: ['admin', 'clinic', 'advisor'],
    default: 'advisor'
  },
  name: {
    type: String
  },
  contact_number: {
    type: Number
  },
  address1: {
    type: String
  },
  address2: {
    type: String
  },
  opening: {
    type: String
  },
  closing: {
    type: String
  },
  event: [{
    type: mongoose.Schema.ObjectId,
    ref: 'event'
  }]
})

// creating hashed password for users
userSchema.pre('save', function (next) {
  var user = this

   // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next()

   // hash the password
  var hash = bcrypt.hashSync(user.password, 10)

   // Override the cleartext password with the hashed one
  user.password = hash
  next()
})

userSchema.methods.validPassword = function (password) {
  // compare is bcrypt method that will return a boolean
  return bcrypt.compareSync(password, this.password)
}

// setting up model
var User = mongoose.model('User', userSchema)

module.exports = User
