const dotenv = require('dotenv').config();
const express = require('express')  
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const userRoute = require('./routes/userRoute')
const productRoute = require('./routes/productRoute')
const errorHandler = require('./middleware/errorMiddleware')
const cookieParser = require('cookie-parser')

// initialize express
const app = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Routes Middleware
app.use('/api/users', userRoute)
app.use('/api/products', productRoute)


// Routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Error Middleware
app.use(errorHandler)

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((err) => console.log(err))


