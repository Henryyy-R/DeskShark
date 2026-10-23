const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Same folder server.js serves from, whatever the working directory is
const uploadDir = path.join(__dirname, '..', 'uploads');

// Configure how and where Multer saves the files
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Auto-create the uploads folder if it doesn't exist yet
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Random name: can't be guessed, and two uploads can never collide
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `TKT-${crypto.randomBytes(16).toString('hex')}${ext}`);
  }
});

// Optional: Security filter to only allow images and PDFs
const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: You can only upload images or PDFs!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;