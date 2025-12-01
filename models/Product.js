const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  imagePublicId: String, // Thêm dòng này
  description: String,
  category: String,
});

module.exports = mongoose.model('Product', productSchema);
