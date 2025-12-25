const express = require('express');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');
const { compressRateLimiter } = require('../middlewares/rateLimit.middleware');
const { handleCompress } = require('../controllers/compress.controller');

const router = express.Router();

/**
 * POST /api/compress
 * Upload and compress a PDF file
 * 
 * Request:
 * - Body: multipart/form-data
 * - Field: 'file' (PDF file, max 40MB)
 * - Optional: 'quality' (screen|ebook|printer|prepress)
 * 
 * Response:
 * - Downloads the compressed PDF directly
 */
router.post(
    '/compress',
    compressRateLimiter,
    upload.single('file'),
    handleUploadError,
    handleCompress
);

module.exports = router;
