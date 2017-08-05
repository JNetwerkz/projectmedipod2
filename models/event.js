const mongoose = require('mongoose')

var eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  datefrom: {
    type: Date,
    required: true
  },
  dateto: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  attendees: [{
    type: mongoose.Schema.ObjectId,
    ref: 'customer'
  }],
  promo: [{
    type: mongoose.Schema.ObjectId,
    ref: 'promo'
  }]
})
// setting up models
var Event = mongoose.model('Event', eventSchema)

module.exports = Event
