import express from 'express';
import { upload } from '../middleware/upload.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    message: 'File uploaded successfully',
    url: fileUrl 
  });
});

export default router;
