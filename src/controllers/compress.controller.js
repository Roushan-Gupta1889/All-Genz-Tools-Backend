const { compressPDF } = require('../services/ghostscript.service');
const { deleteFilesImmediately } = require('../utils/cleanup');
const { formatBytes } = require('../utils/fileManager');
const path = require('path');

/**
 * Handle PDF compression request
 */
async function handleCompress(req, res, next) {
    let inputPath = null;
    let outputPath = null;

    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded. Please upload a PDF file.'
            });
        }

        inputPath = req.file.path;
        const quality = req.body.quality || req.query.quality || 'ebook';

        console.log(`📥 Received file: ${req.file.originalname} (${formatBytes(req.file.size)})`);

        // Compress the PDF
        const result = await compressPDF(inputPath, quality);
        outputPath = result.outputPath;

        // Determine compression effectiveness and generate smart feedback
        const compressionRatio = result.compressionRatio;
        let message = 'PDF compressed successfully';
        let status = 'success';
        let warnings = [];
        let tips = [];

        // Case 1: Excellent compression (50%+ reduction)
        if (compressionRatio >= 50) {
            message = 'PDF compressed successfully - Excellent compression achieved!';
            status = 'excellent';
        }
        // Case 2: Good compression (20-50% reduction)
        else if (compressionRatio >= 20) {
            message = 'PDF compressed successfully - Good compression achieved';
            status = 'good';
        }
        // Case 3: Minimal compression (5-20% reduction)
        else if (compressionRatio >= 5) {
            message = 'PDF compressed successfully - Moderate compression achieved';
            status = 'moderate';
            warnings.push('This PDF had limited compression potential. It may already be optimized.');
            tips.push('Try a lower quality preset (e.g., "screen") for more compression, though quality may decrease.');
        }
        // Case 4: Very minimal compression (<5% reduction)
        else if (compressionRatio >= 0) {
            message = 'PDF processed - Minimal compression achieved';
            status = 'minimal';
            warnings.push('This PDF is already well-optimized. Compression had minimal effect.');
            tips.push('This usually happens with: text-only PDFs, already-compressed PDFs, or vector graphics.');
        }
        // Case 5: Compressed file is larger (negative compression)
        else {
            message = 'PDF processed - File size increased slightly';
            status = 'increased';
            warnings.push('The compressed file is slightly larger than the original.');
            tips.push('This can happen with already-optimized PDFs. Consider using the original file or try "screen" preset.');
        }

        // Prepare response data with enhanced feedback
        const responseData = {
            success: true,
            message: message,
            status: status,
            data: {
                originalFilename: req.file.originalname,
                compressedFilename: path.basename(result.outputPath),
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                originalSizeFormatted: formatBytes(result.originalSize),
                compressedSizeFormatted: formatBytes(result.compressedSize),
                compressionRatio: result.compressionRatio,
                savedBytes: result.originalSize - result.compressedSize,
                savedBytesFormatted: formatBytes(result.originalSize - result.compressedSize),
                quality: quality,
                downloadUrl: `/api/download/${path.basename(result.outputPath)}`
            },
            ...(warnings.length > 0 && { warnings }),
            ...(tips.length > 0 && { tips })
        };

        // Send the compressed file directly as download
        res.download(outputPath, `compressed_${req.file.originalname}`, async (err) => {
            if (err) {
                console.error('❌ Error sending file:', err.message);
            }

            // Immediately delete both files after download completes (or fails)
            await deleteFilesImmediately(inputPath, outputPath);
        });

    } catch (error) {
        console.error('❌ Compression error:', error.message);

        // Clean up files on error (only delete if they exist)
        const filesToDelete = [inputPath, outputPath].filter(Boolean);
        if (filesToDelete.length > 0) {
            await deleteFilesImmediately(...filesToDelete);
        }

        // Pass error to error handler middleware
        next(error);
    }
}

module.exports = {
    handleCompress
};
