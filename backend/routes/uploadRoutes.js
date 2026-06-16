const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

// ==========================================
// POST /api/uploads - Upload a single file
// ==========================================
router.post('/', upload.single('attachment'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the URL path so the frontend can display the image or attach it to a ticket
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });
    
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;