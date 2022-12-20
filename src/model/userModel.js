const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    trim: true,
    require: true
  },
  lname: {
    type: String,
    trim: true,
    require: true
  },
  email: {
    type: String,
    require: true,
    trim: true,
    unique: true
  },
  profileImage: {
    type: String,
    trim: true,
    require: true
  },
  phone: {
    type: String,
    require: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    trim: true,
    require: true,
    max: 15,
    min: 8
  },
  address: {
    shipping: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        pincode: { type: Number, required: true, trim: true }
    },

    billing: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        pincode: { type: Number, required: true, trim: true }
    },
},
  createdAt: Date,

  updatedAt: Date


}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)
