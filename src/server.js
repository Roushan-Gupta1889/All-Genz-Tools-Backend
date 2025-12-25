const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PORT, CORS_ORIGIN, NODE_ENV } = require('./config/constants');
const { ensureDirectoriesExist } = require('./utils/fileManager');
const { startCleanupService } = require('./utils/cleanup');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');
const compressRoutes = require('./routes/compress.route');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'PDF Compression API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', compressRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Initialize server
async function startServer() {
    try {
        // Create necessary directories
        await ensureDirectoriesExist();

        // Start cleanup service
        const stopCleanup = startCleanupService();

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ========================================');
            console.log(`🚀 PDF Compression API Server Started`);
            console.log('🚀 ========================================');
            console.log(`📡 Environment: ${NODE_ENV}`);
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`📡 Health: http://localhost:${PORT}/health`);
            console.log(`📡 API: http://localhost:${PORT}/api/compress`);
            console.log(`🔒 CORS Origin: ${CORS_ORIGIN}`);
            console.log('🚀 ========================================');
            console.log('');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('⚠️  SIGTERM signal received: closing HTTP server');
            stopCleanup();
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('\n⚠️  SIGINT signal received: closing HTTP server');
            stopCleanup();
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
