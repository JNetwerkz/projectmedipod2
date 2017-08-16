const mongoose = require('mongoose')

var promoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  agencyprefix: {
    type: String,
    required: true,
    toUpperCase: true,
    minlength: [1, 'Agency Prefix has to be at least 1 character'],
    maxlength: [5, 'Agency Prefix can\'t be more than 5 characters']
  },
  promocodeprefix: {
    type: String,
    required: true,
    toUpperCase: true,
    minlength: [1, 'Promo Prefix has to be at least 1 character'],
    maxlength: [5, 'Promo Prefix can\'t be more than 5 characters']
  },
  validity: {
    type: Number,
    required: true
  },
  attendees: [{
    type: mongoose.Schema.ObjectId,
    ref: 'customer'
  }]
})
// setting up models
var Promo = mongoose.model('Promo', promoSchema)

module.exports = Promo
