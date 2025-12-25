const fs = require('fs').promises;
const path = require('path');
const { UPLOAD_DIR, OUTPUT_DIR } = require('../config/constants');

/**
 * Create necessary directories if they don't exist
 */
async function ensureDirectoriesExist() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log('✅ Directories created/verified: uploads/ and outputs/');
    } catch (error) {
        console.error('❌ Error creating directories:', error);
        throw error;
    }
}

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix (e.g., 'compressed_')
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    // Sanitize filename (remove special characters)
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    return `${prefix}${sanitizedName}_${timestamp}_${randomSuffix}${ext}`;
}

/**
 * Safely delete a file
 * @param {string} filePath - Absolute path to file
 */
async function deleteFile(filePath) {
    try {
        await fs.access(filePath); // Check if file exists
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted: ${path.basename(filePath)}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`❌ Error deleting file ${filePath}:`, error.message);
        }
    }
}

/**
 * Get file size in bytes
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<number>} File size in bytes
 */
async function getFileSize(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.size;
    } catch (error) {
        console.error(`❌ Error getting file size for ${filePath}:`, error.message);
        return 0;
    }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string (e.g., "2.5 MB")
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
    ensureDirectoriesExist,
    generateUniqueFilename,
    deleteFile,
    getFileSize,
    formatBytes
};
