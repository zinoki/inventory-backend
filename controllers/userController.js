const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}


// Register User
const registerUser = asyncHandler(async (req,res) => { // async handler from #61 register user
  const {name, email, password} = req.body

  // Validation
  if (!name || !email || !password) {
    res.status(400)
    throw new Error("Please fill in all required fields")
  }
  if (password.length < 6) {
    res.status(400)
    throw new Error("Password must be at least 6 characters")
  }

  // Check if user email already exists
  const userExists = await User.findOne({email})

  if (userExists) {
    res.status(400)
    throw new Error("Email has already been registered")
  }  
  
  // Create new user
  const user = await User.create({
    name,
    email,
    password
  })

  // Generate Token
  const token = generateToken(user._id)

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now()+1000*86400), // 1 day
    sameSite: "none",
    secure: true
  })

  if (user) {
    const { _id, name, email, photo, phone, bio } = user
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token
    })
  } else {
    res.status(400)
    throw new Error("Invalid user data")
  }
})

// Login User
const loginUser = asyncHandler(async (req,res) => { // async handler from #61 register user
  const {email, password} = req.body
  // Validate Request
  if (!email || !password) {
    res.status(400)
    throw new Error("Please enter email and password")
  }

  // Check if user exists
  const user = await User.findOne({email})
  if (!user) {
    res.status(400)
    throw new Error("User not found. Please register.")
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password)

  if(user && passwordIsCorrect) {
    
      // Generate Token
    const token = generateToken(user._id)

    // Send HTTP-only cookie
    res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now()+1000*86400), // 1 day
    sameSite: "none",
    secure: true
  })

    const { _id, name, email, photo, phone, bio } = user
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token
    })
  } else {
    res.status(400)
    throw new Error("Invalid email or password")
  }

  res.send("Login user")
})

// Logout User
const logout = asyncHandler(
  async(req, res) => {
    res.cookie("token", "", {
      path: '/',
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true
    })
    return res.status(200).json({ message: "Successfully logged out"})
    
  }
)

// Get User Data
const getUser = asyncHandler(
  async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
      const { _id, name, email, photo, phone, bio } = user
      res.status(200).json({
        _id,
        name,
        email,
        photo,
        phone,
        bio
      })
    } else {
      res.status(400)
      throw new Error("User not found.")
    }
  }
)

// Get login status
const loginStatus = asyncHandler(
  async (req, res) => {
    const token = req.cookies.token
    if (!token) {
      return res.json(false)
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET)
    
    if (verified) {
      return res.json(true)
    } else {
      return res.json(false)
    }
  }  
)

// Update User
const updateUser = asyncHandler(
  async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
      const { name, email, photo, phone, bio } = user
      user.email = email
      user.name = req.body.name || name
      user.email = req.body.email || email
      user.photo = req.body.photo || photo
      user.phone = req.body.phone || phone
      user.bio = req.body.bio || bio
      const updatedUser = await user.save()
     
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo,
        phone: updatedUser.phone,
        bio: updatedUser.bio
      })
    } else {
      res.status(404)
      throw new Error("User not found")
    }

  }
)

// Change Password
const changePassword = asyncHandler(
  async (req, res) => {
    const user = await User.findById(req.user._id)
    const { oldPassword, password } = req.body
    if (!user) {
      res.status(400)
      throw new Error("User not found. Please sign up")
    }

    // Validate
    if (!oldPassword || !password) {
      res.status(400)
      throw new Error("Please add old and new password")
    }

    // Check if password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    // Save new password
    if (user && passwordIsCorrect) {
      user.password = password
      await user.save()
      res.status(200).send("Password change successful")
    } else {
      res.status(400)
      throw new Error("Old password was incorrect")
    }
})

const forgotPassword = asyncHandler(
  async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if (!user) {
      res.status(404)
      throw new Error("User does not exist")
    }
    // Delete token if it exists in DB
    let token = await Token.findOne({userId: user._id})
    if (token) {
      await token.deleteOne()
    }
      // Create reset token
      let resetToken = crypto.randomBytes(32).toString("hex") + user._id

      // Hash token before saving to DB
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

      // Save Token to DB
      await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60*1000) // 30 minutes
      }).save()

      // Construct reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

      // Reset Email
      const message = `
      <h2>Hello ${user.name}
      <p>Please use the url below to reset your password</p>
      <p>Reset link is valid for only 30 minutes.</p>
      
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards,</p>
      <p>Zack</p>`

      const subject = "Password Reset Request for Inventory Manger"
      const send_to = user.email
      const sent_from = process.env.EMAIL_USER

      try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({success: true, message: "Reset Email sent"})
      } catch (err) {
        res.status(500)
        throw new Error("Email not sent. Please try again.")
      }

  }
)


module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword
}
