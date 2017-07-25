const mongoose = require('mongoose')

var companySchema = new mongoose.Schema({
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
  attendee: [{
    type: mongoose.Schema.ObjectId,
    ref: 'customer'
  }]
})
// setting up models
var Company = mongoose.model('Company', companySchema)

module.exports = Company
