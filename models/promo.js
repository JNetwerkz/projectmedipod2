const mongoose = require('mongoose')

var promoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    minlength: [5, 'Code has to be at least 5 characters'],
    maxlength: [99, 'Code cannot be more than 99 characters']
  },
  is_redeemed: {
    type: Boolean,
    required: true,
    default: false
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
var Promo = mongoose.model('Promo', promoSchema)

module.exports = Promo
