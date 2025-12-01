const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, default: null },
  lastName:  { type: String, default: null },
  email:  { type: String, default: null },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null }, // Có thể null
  avatarPublicId: { type: String, default: null }, // Thêm trường này để hỗ trợ Cloudinary
  phone: { type: String, default: null },  // Có thể null
  addresses: { type: [String], default: [] }, // Có thể null hoặc mảng rỗng
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer',
  },
  locked: { type: Boolean, default: false }, // Thêm trường này
});

module.exports = mongoose.model('User', userSchema);