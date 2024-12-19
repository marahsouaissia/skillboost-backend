const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
  },
  lastname: {
    type: String,
    required: false,
  },
  phone: {
    type: Number,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true, 
    lowercase: true, 
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: false,
  },
  image :{
    path : String,
    size : String
  },
  testsTaken: [{
    test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    score: { type: Number },
  }],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});


module.exports = mongoose.model('User', userSchema);


