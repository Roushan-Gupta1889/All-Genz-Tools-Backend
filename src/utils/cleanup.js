const fs = require('fs').promises;
const path = require('path');
const { UPLOAD_DIR, OUTPUT_DIR, CLEANUP_INTERVAL_MS, FILE_MAX_AGE_MS } = require('../config/constants');
const { deleteFile } = require('./fileManager');

/**
 * Delete files older than specified age
 * @param {string} directory - Directory to clean
 * @param {number} maxAge - Maximum age in milliseconds
 */
async function cleanupOldFiles(directory, maxAge = FILE_MAX_AGE_MS) {
    try {
        const files = await fs.readdir(directory);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(directory, file);

            try {
                const stats = await fs.stat(filePath);
                const fileAge = now - stats.mtimeMs;

                if (fileAge > maxAge) {
                    await deleteFile(filePath);
                    deletedCount++;
                }
            } catch (error) {
                console.error(`❌ Error processing file ${file}:`, error.message);
            }
        }

        if (deletedCount > 0) {
            console.log(`🧹 Cleanup: Deleted ${deletedCount} old files from ${path.basename(directory)}/`);
        }
    } catch (error) {
        console.error(`❌ Error during cleanup in ${directory}:`, error.message);
    }
}

/**
 * Run cleanup on both upload and output directories
 */
async function runCleanup() {
    console.log('🧹 Running scheduled cleanup...');
    await cleanupOldFiles(UPLOAD_DIR);
    await cleanupOldFiles(OUTPUT_DIR);
}

/**
 * Start automatic cleanup service
 */
function startCleanupService() {
    console.log(`🧹 Cleanup service started (runs every ${CLEANUP_INTERVAL_MS / 1000}s)`);

    // Run initial cleanup
    runCleanup();

    // Schedule recurring cleanup
    const intervalId = setInterval(runCleanup, CLEANUP_INTERVAL_MS);

    // Return cleanup function for graceful shutdown
    return () => {
        clearInterval(intervalId);
        console.log('🧹 Cleanup service stopped');
    };
}

/**
 * Immediately delete both input and output files (after response sent)
 * @param {string} inputPath - Path to uploaded file
 * @param {string} outputPath - Path to compressed file
 */
async function deleteFilesImmediately(...filePaths) {
    // Filter out null, undefined, or empty paths
    const validPaths = filePaths.filter(path => path && typeof path === 'string');

    if (validPaths.length === 0) {
        return; // Nothing to delete
    }

    await Promise.all(validPaths.map(path => deleteFile(path)));
}

module.exports = {
    cleanupOldFiles,
    runCleanup,
    startCleanupService,
    deleteFilesImmediately
};
