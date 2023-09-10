const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/uploadFile");
const cloudinary = require('cloudinary').v2


const createProduct = asyncHandler(
  async(req, res) => {
    const { name, sku, category, quantity, price, description } = req.body
    // Validation 
    if (!name ||!category || !quantity || !price ||!description) {
      res.status(400)
      throw new Error("Please fill in all fields")
    }

    // Handle Image upload
    let fileData = {}
    if (req.file) {
      // save image to cloudinary
      let uploadedFile
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "InventoryApp", resource_type: "image"})
      } catch {
        res.status(500)
        throw new Error("Image could not be uploaded")
      }
      fileData = {
        fileName: req.file.originalname,
        filePath: uploadedFile.secure_url,
        fileType: req.file.mimetype,
        fileSize: fileSizeFormatter(req.file.size, 2)
      }
    }


    // Create product
    const product = await Product.create({
      user: req.user.id,
      name,
      sku,
      category,
      quantity,
      price,
      description,
      image: fileData
    })
    res.status(201).json(product)

  }

)

// Get all products

const getProducts = asyncHandler(
  async (req, res) => {
    const products = await Product.find({user: req.user.id}).sort("-createdAt")
    res.status(200).json(products)
  }
)

module.exports = {
  createProduct,
  getProducts
}