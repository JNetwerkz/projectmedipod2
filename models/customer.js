const mongoose = require('mongoose')

var customerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  add1: {
    type: String,
    required: true
  },
  add2: {
    type: String,
    required: true
  },
  postalcode: {
    type: String,
    required: true,
    minlength: [6, 'Postal Code is 6 characters'],
    maxlength: [6, 'Code cannot be more than 99 characters']
  },
  contactno: {
    type: Number,
    required: true,
    minlength: [8, 'Code has to be at least 5 characters'],
    maxlength: [8, 'Code cannot be more than 99 characters']
  },
  email: {
    type: String,
    required: true
  },
  DOB: {
    type: String,
    required: true
  },
  ic: {
    type: String,
    required: true,
    minlength: [9, 'Code has to be at least 5 characters'],
    maxlength: [9, 'Code cannot be more than 99 characters']
  },
  event: [{
    type: mongoose.Schema.ObjectId,
    ref: 'event'
  }],
  attendee: [{
    type: mongoose.Schema.ObjectId,
    ref: 'customer'
  }]
})
// setting up models
var Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer
