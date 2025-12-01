const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Định nghĩa schema và model cho Category nếu chưa có
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// Lấy tất cả loại sản phẩm
router.get('/Categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Thêm loại sản phẩm mới
router.post('/Categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên loại không được để trống' });
    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: 'Không thể thêm loại sản phẩm' });
  }
});

// Sửa tên loại sản phẩm
router.put('/Categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Không thể sửa loại sản phẩm' });
  }
});

// Xóa loại sản phẩm
router.delete('/Categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Không thể xóa loại sản phẩm' });
  }
});

module.exports = router;