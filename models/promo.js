const mongoose = require('mongoose')

var promoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // code: {
  //   type: String,
  //   required: true,
  //   minlength: [5, 'Code has to be at least 5 characters'],
  //   maxlength: [99, 'Code cannot be more than 99 characters']
  // },
  // is_redeemed: {
  //   type: Boolean,
  //   required: true,
  //   default: false
  // },
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
  // not sure if event is needed here
  event: [{
    type: mongoose.Schema.ObjectId,
    ref: 'event'
  }],
  codes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'codes'
  }]
})
// setting up models
var Promo = mongoose.model('Promo', promoSchema)

module.exports = Promo
