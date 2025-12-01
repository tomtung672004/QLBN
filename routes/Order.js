const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

// Tạo đơn hàng mới
router.post('/Orders', async (req, res) => {
  try {
    const { username, items, total, phone, address } = req.body;
    const order = new Order({
      username,
      items,
      total,
      phone,
      address,
      status: 'Chờ xác nhận', // Cập nhật status khi tạo mới
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: 'Lỗi khi tạo đơn hàng' });
  }
});

// Lấy tất cả đơn hàng (cho admin)
router.get('/Orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .select('username items total phone address status createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy đơn hàng' });
  }
});

// Lấy tất cả đơn hàng của 1 user (có hiện địa chỉ)
router.get('/Orders/:username', async (req, res) => {
  try {
    const orders = await Order.find({ username: req.params.username })
      .populate('items.product')
      .select('items total phone address status createdAt'); // Hiện địa chỉ, số điện thoại, trạng thái, ngày tạo
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy đơn hàng' });
  }
});

// Cập nhật trạng thái đơn hàng
router.put('/Orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái đơn hàng' });
  }
});

// Xóa đơn hàng
router.delete('/Orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa đơn hàng' });
  }
});

module.exports = router;