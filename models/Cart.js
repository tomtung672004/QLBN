const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  username: String,
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',required: true // Tham chiếu tới Product
  },
  quantity: Number,
});

module.exports = mongoose.model('Cart', cartSchema);

