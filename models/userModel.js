const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please enter a valid email"
    ]
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minLength: [6, "Password must be at least 6 characters"],
    maxLength: [22, "Password must be at most 22 characters"],
  },
  photo: {
    type: String,
    required: [true, "Please add a photo"],
    default: "https://i.ibb.co/4pDNDk1/avatar.png"
  },
  phone: {
    type: String,
    default: "+1"
  },
  bio: {
    type: String,
    default: "Bio",
    maxLength: [250, "Bio must not be greater than 250 characters"],
  }
}, {
  timestamps: true
})

const User = mongoose.model('User', userSchema)

module.exports = User