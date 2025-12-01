const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Đăng ký tài khoản mới (hỗ trợ customer)
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, avatar, phone, addresses } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }
    // Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    const user = new User({ username, password, firstName, lastName, email, avatar, phone, addresses });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// API lấy thông tin 1 khách hàng theo username
router.get('/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy danh sách tất cả khách hàng
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Cập nhật thông tin user theo username
router.put('/users/:username', async (req, res) => {
  try {
    const { email, ...otherFields } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    // Cập nhật email và các trường khác (không gửi mail xác thực)
    if (email) {
      user.email = email;
      user.emailVerified = true; // Nếu muốn luôn xác thực
      user.emailToken = undefined;
    }
    Object.assign(user, otherFields);
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.avatarPublicId !== undefined) user.avatarPublicId = req.body.avatarPublicId;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Xóa khách hàng theo _id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    // Xóa avatar trên Cloudinary nếu có
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        // Có thể log lỗi nếu cần, nhưng vẫn tiếp tục xóa user
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Khóa hoặc mở khóa tài khoản theo _id
router.put('/users/:id/lock', async (req, res) => {
  try {
    // Lấy giá trị locked từ body, mặc định là true nếu không truyền
    const { locked = true } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { locked },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Upload avatar cho user
router.post('/users/:username/upload-avatar', async (req, res) => {
  try {
    const { imageBase64, oldPublicId } = req.body;

    // Xóa ảnh cũ nếu có
    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }

    // Upload ảnh mới
    const uploadRes = await cloudinary.uploader.upload(
      'data:image/jpeg;base64,' + imageBase64,
      { folder: 'avatars' }
    );

    // Trả về url và public_id mới
    res.json({
      avatar: uploadRes.secure_url,
      avatarPublicId: uploadRes.public_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi upload avatar', detail: error.message });
  }
});

// Đổi mật khẩu
router.post('/users/:username/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    // Nếu chưa hash password:
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đổi mật khẩu' });
  }
});

module.exports = router;