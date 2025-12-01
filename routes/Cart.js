const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const router = express.Router();

// Lấy toàn bộ giỏ hàng
router.get('/Carts/:username', async (req, res) => {
  try {
    const userCarts = await Cart.find({ username: req.params.username }).populate('product');
    res.status(200).json(userCarts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng theo người dùng' });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/Carts', async (req, res) => {
  try {
    const { username, product, quantity } = req.body;
    const newItem = new Cart({ username, product, quantity });
    await newItem.save();
    const populatedItem = await newItem.populate('product');
    res.status(201).json({ success: true, item: populatedItem });
  } catch (err) {
    console.error('Lỗi khi thêm sản phẩm vào giỏ:', err.message);
    res.status(400).json({ error: 'Lỗi thêm sản phẩm' });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/Carts/:username/:productId', async (req, res) => {
  const { quantity } = req.body;
  try {
    const updatedItem = await Cart.findOneAndUpdate(
      { username: req.params.username, product: req.params.productId },
      { quantity },
      { new: true }
    ).populate('product');
    if (!updatedItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }
    res.json({ item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật', error });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/Carts/:username/:productId', async (req, res) => {
  try {
    const deleted = await Cart.findOneAndDelete({
      username: req.params.username,
      product: new mongoose.Types.ObjectId(req.params.productId)
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
    }
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', item: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa', error: error.message });
  }
});

// Xóa toàn bộ sản phẩm trong giỏ hàng của 1 user
router.delete('/Carts/:username', async (req, res) => {
  try {
    const result = await Cart.deleteMany({ username: req.params.username });
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa toàn bộ giỏ hàng', error: error.message });
  }
});

module.exports = router;