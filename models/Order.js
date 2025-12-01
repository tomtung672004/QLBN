const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
    },
  ],
  total: Number,
  phone: { type: String },
  address: { type: String },
  status: { type: String, default: 'Chờ xác nhận' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);