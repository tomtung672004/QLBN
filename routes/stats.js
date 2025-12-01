const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

router.get('/stats', async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Chỉ lấy đơn hàng đã xác nhận trong ngày
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'Đã xác nhận'
    });

    const revenueTodayAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: 'Đã xác nhận' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenueToday = revenueTodayAgg[0]?.total || 0;

    // Doanh thu tháng (chỉ đơn đã xác nhận)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const revenueMonthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Đã xác nhận' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenueMonth = revenueMonthAgg[0]?.total || 0;

    res.json({
      totalCustomers,
      ordersToday,
      revenueToday,
      revenueMonth,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;