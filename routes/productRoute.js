const express = require('express')
const protect = require('../middleware/authMiddleware')
const { createProduct, getProducts } = require('../controllers/productController')
const router = express.Router()
const { upload } = require('../utils/uploadFile')

router.post("/", protect, upload.single("image"), createProduct)
router.get("/", protect, getProducts)

module.exports = router