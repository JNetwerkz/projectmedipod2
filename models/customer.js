const mongoose = require('mongoose')

// regex for nirc
// const nircRegex = /^[STFG]\d{7}[A-Z]$/

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
  address1: {
    type: String
  },
  address2: {
    type: String
  },
  postalcode: {
    type: Number,
    minlength: [6, 'Postal Code Number has to be 6 digits'],
    maxlength: [6, 'Postal Code Number has to be 6 digits']
  },
  contactno: {
    type: Number,
    required: true,
    minlength: [8, 'Contact Number has to be 8 digits'],
    maxlength: [8, 'Contact Number has to be 8 digits']
  },
  email: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  ic: {
    type: String,
    required: true,
    minlength: [9, 'IC Number has to be 9 characters'],
    maxlength: [9, 'IC Number has to be 9 characters'],
    // match: nircRegex
  },
  creation_date: {
    type: Date,
    default: Date.now
  },
  has_attended: {
    type: Boolean,
    default: false
  },
  has_code: {
    type: Boolean,
    default: false
  },
  pdpa_consent: {
    type: Boolean
  },
  event: [{
    type: mongoose.Schema.ObjectId,
    ref: 'event'
  }]
})
// setting up models
var Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer
