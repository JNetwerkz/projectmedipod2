const mongoose = require('mongoose')

var promoSchema = new mongoose.Schema({
  name: {
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
