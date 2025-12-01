const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./Serverconfig');
const authRoutes = require('../routes/User');
const ProductRoute = require('../routes/Product');
const CartRoute = require('../routes/Cart');
const OrderRoute = require('../routes/Order');
const statsRouter = require('../routes/Stats');
const CategoriesRoute = require('../routes/Categories');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // hoặc lớn hơn nếu cần
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Đảm bảo thư mục uploads tồn tại
const fs = require('fs');
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cho phép truy cập file ảnh tĩnh
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/', authRoutes);
app.use('/', ProductRoute);
app.use('/', CartRoute);
app.use('/', OrderRoute);
app.use('/', statsRouter);
app.use('/', CategoriesRoute);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
