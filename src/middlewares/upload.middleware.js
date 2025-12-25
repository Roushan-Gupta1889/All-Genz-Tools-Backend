const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } = require('../config/constants');
const { generateUniqueFilename } = require('../utils/fileManager');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
    }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Only PDF files are allowed'), false);
    }

    if (ext !== '.pdf') {
        return cb(new Error('File must have .pdf extension'), false);
    }

    cb(null, true);
};

// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES
    },
    fileFilter: fileFilter
});

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
};
