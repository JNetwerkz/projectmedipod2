const mongoose = require('mongoose')

var codeSchema = new mongoose.Schema({
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
  attendee: [{
    type: mongoose.Schema.ObjectId,
    ref: 'customer'
  }]
})
// setting up models
var Code = mongoose.model('Code', codeSchema)

module.exports = Code
