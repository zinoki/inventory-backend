const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

const protect = asyncHandler(
  async(req, res, next) => {
    try {
      const token = req.cookies.token
      if(!token) {
        // res.status(401)
        throw new Error("Not authorized. Please login.")
      }
      // Verify token
      const verified = jwt.verify(token, process.env.JWT_SECRET)
      // Get user ID from token
      const user = await User.findById(verified.id).select("-password")
      
      if (!user) {
        throw new Error("User not found.")
      }

      req.user = user

      next()

    } catch {
      // res.status(401)
      throw new Error("Not authorized. Please login.")
    }
  }
)

module.exports = protect