const { deleteFile } = require('../utils/fileManager');

/**
 * Global error handler middleware
 * Catches all errors and sends consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
        deleteFile(req.file.path).catch(console.error);
    }

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
