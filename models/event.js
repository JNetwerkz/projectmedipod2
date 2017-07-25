const mongoose = require('mongoose')

var eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  datefrom: {
    type: String,
    required: true
  },
  dateto: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  agencyprefix: {
    type: String,
    required: true,
    minlength: [2, 'Agency Prefix has to be 2 characters'],
    maxlength: [2, 'Agency Prefix has to be 2 characters']
  },
  promocodeprefix: {
    type: String,
    required: true,
    minlength: [2, 'Promo Prefix has to be 2 characters'],
    maxlength: [2, 'Promo Prefix has to be 2 characters']
  },
  validity: {
    type: String,
    required: true
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
var Event = mongoose.model('Event', eventSchema)

module.exports = Event
