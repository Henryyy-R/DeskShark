const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure how and where Multer saves the files
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/';
    // Auto-create the uploads folder if it doesn't exist yet
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    // Rename the file with a timestamp so users don't overwrite each other's files
    cb(null, `TKT-${Date.now()}${path.extname(file.originalname)}`);
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