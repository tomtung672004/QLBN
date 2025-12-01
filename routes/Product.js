const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('../server/cloudinary');

// Cấu hình lưu file 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Route upload ảnh local 
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file' });
  }
  // Đường dẫn public cho client
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

// Upload image to Cloudinary 
router.post('/products/upload-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh' });

    const uploadRes = await cloudinary.uploader.upload(
      'data:image/jpeg;base64,' + imageBase64,
      { folder: 'products' }
    );
    res.json({
      imageUrl: uploadRes.secure_url,
      publicId: uploadRes.public_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi upload ảnh', detail: error.message });
  }
});

// Lấy tất cả sản phẩm
router.get('/Drinks', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Thêm sản phẩm mới
router.post('/Drinks', async (req, res) => {
  try {
    const { name, price, image, imagePublicId, description, category } = req.body;
    const product = new Product({ name, price, image, imagePublicId, description, category });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: 'Lỗi thêm sản phẩm' });
  }
});

// Xóa sản phẩm và ảnh trên Cloudinary
router.delete('/Drinks/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa sản phẩm' });
  }
});

// Sửa sản phẩm 
router.put('/Drinks/:id', async (req, res) => {
  try {
    const { name, price, image, imagePublicId, description, category } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, image, imagePublicId, description, category },
      { new: true }
    );
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ error: 'Lỗi cập nhật sản phẩm' });
  }
});

module.exports = router;
