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

// Get single product
const getProduct = asyncHandler(
  async (req, res) => {
    const product = await Product.findById(req.params.id)
    // If product doesn't exist
  if (!product) {
    res.status(404) 
    throw new Error("Product not found")
  }

  // Match product to user
  if (product.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error("User not authorized")
  }
  res.status(200).json(product)
  }
)

// Delete a product
const deleteProduct = asyncHandler(
  async (req, res) => {
    const product = await Product.findById(req.params.id)
    // If product doesn't exist
  if (!product) {
    res.status(404) 
    throw new Error("Product not found")
  }

  // Match product to user
  if (product.user.toString() !== req.user.id) {
    res.status(401)
    throw new Error("User not authorized")
  }

  await product.deleteOne()
  res.status(200).json({message: "Product deleted successfully"})
}
)

// Update a product
const updateProduct = asyncHandler(
  async (req, res) => {
    const { name, sku, category, quantity, price, description } = req.body
    const {id} = req.params

    const product = await Product.findById(id)
    // If product does not exist
    if (!product) {
      res.status(404)
      throw new Error("Product not found")
    }

    // Match product to user
    if (product.user.toString() !== req.user.id) {
      res.status(401)
      throw new Error('User not authorized')
    } 


    // Handle image upload
    let fileData = {}
    if (req.file) {
      // Save image to cloudinary
      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, 
        {
          folder: "InventoryApp",
          resource_type: "image"
        })
      } catch(err) {
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

    // Update product

    const updatedProduct = await Product.findByIdAndUpdate(
      {_id: id},
      {
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData
      },
      {
        new: true,
        runValidators: true
      }
    )
    res.status(200).json(updatedProduct)

  }
)

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct
}