const path = require('path');
require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // File Upload Limits
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 40,
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB) || 40) * 1024 * 1024,

  // Allowed File Types
  ALLOWED_MIME_TYPES: ['application/pdf'],
  ALLOWED_FILE_EXTENSIONS: ['.pdf'],

  // Directory Paths
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  OUTPUT_DIR: path.join(__dirname, '../../outputs'),

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',

  // Rate Limiting (5 requests per 10 minutes)
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000, // 10 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,

  // Cleanup Configuration
  CLEANUP_INTERVAL_MS: parseInt(process.env.CLEANUP_INTERVAL_MS) || 2 * 60 * 1000, // 2 minutes
  FILE_MAX_AGE_MS: parseInt(process.env.FILE_MAX_AGE_MS) || 5 * 60 * 1000, // 5 minutes

  // Ghostscript Compression Presets
  // User-friendly names (recommended for public API)
  GS_PRESETS: {
    // New user-friendly names
    recommended: '/ebook',  // 150 DPI - balanced quality/size (DEFAULT)
    strong: '/screen',      // 72 DPI - maximum compression

    // Legacy names (for backward compatibility)
    ebook: '/ebook',        // Same as 'recommended'
    screen: '/screen',      // Same as 'strong'
    printer: '/printer',    // 300 DPI - high quality (advanced users)
    prepress: '/prepress'   // 300+ DPI - maximum quality (advanced users)
  },
  DEFAULT_PRESET: process.env.GS_COMPRESSION_PRESET || 'recommended',

  // Ghostscript Processing Timeout
  // 2 minutes is the sweet spot for 512MB VPS:
  // - Most PDFs compress in under 90 seconds
  // - Prevents long-lived processes blocking the server
  // - Avoids DoS vectors from malicious/complex PDFs
  // - Matches real SaaS behavior (even premium services timeout large jobs)
  GS_TIMEOUT_MS: parseInt(process.env.GS_TIMEOUT_MS) || 2 * 60 * 1000, // 2 minutes

  // Quality parameter aliases for UX clarity
  QUALITY_ALIASES: {
    'recommended': 'ebook',
    'strong': 'screen'
  }
};
