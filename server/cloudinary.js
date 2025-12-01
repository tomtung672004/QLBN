const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'djh3oalov',
  api_key: '313431578753357',
  api_secret: '11q7If8jmbKGWNEYE3XXFUp-mAI',
});

module.exports = cloudinary;