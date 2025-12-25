const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const { OUTPUT_DIR, GS_PRESETS, DEFAULT_PRESET, GS_TIMEOUT_MS } = require('../config/constants');
const { generateUniqueFilename, getFileSize } = require('../utils/fileManager');

const execFileAsync = promisify(execFile);

const GS_COMMAND = process.platform === 'win32' ? 'gswin64c' : 'gs';

/**
 * Compress PDF using Ghostscript
 * @param {string} inputPath - Path to input PDF
 * @param {string} quality - Compression quality preset (screen|ebook|printer|prepress)
 * @returns {Promise<{outputPath: string, originalSize: number, compressedSize: number, compressionRatio: number}>}
 */
async function compressPDF(inputPath, quality = DEFAULT_PRESET) {
    // Validate quality preset
    const preset = GS_PRESETS[quality] || GS_PRESETS[DEFAULT_PRESET];

    // Map user-friendly names to internal names for pipeline decision
    // 'recommended' -> 'ebook', 'strong' -> 'screen'
    const internalQuality = quality === 'recommended' ? 'ebook' :
        quality === 'strong' ? 'screen' : quality;

    // Generate output filename
    const outputFilename = generateUniqueFilename(path.basename(inputPath), 'compressed_');
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    let gsArgs;

    // 🟢 PIPELINE 1: SAFE COMPRESSION (recommended, ebook, printer, prepress)
    // Predictable, minimal risk, handles 90% of users safely
    if (internalQuality !== 'screen') {
        gsArgs = [
            '-sDEVICE=pdfwrite',
            `-dPDFSETTINGS=${preset}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dSAFER',
            '-dCompatibilityLevel=1.4',
            '-dCompressFonts=true',
            '-dSubsetFonts=true',
            `-sOutputFile=${outputPath}`,
            inputPath
        ];
    }
    // 🔴 PIPELINE 2: AGGRESSIVE COMPRESSION (screen only)
    // Strong compression with image downsampling and quality reduction
    // USER EXPLICITLY CHOSE THIS - they want maximum compression
    else {
        gsArgs = [
            '-sDEVICE=pdfwrite',
            `-dPDFSETTINGS=${preset}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dSAFER',
            '-dCompatibilityLevel=1.4',

            // 🔥 REAL COMPRESSION: Image resolution control
            '-dDownsampleColorImages=true',
            '-dColorImageResolution=72',
            '-dColorImageDownsampleType=/Bicubic',
            '-dDownsampleGrayImages=true',
            '-dGrayImageResolution=72',
            '-dGrayImageDownsampleType=/Bicubic',
            '-dDownsampleMonoImages=true',
            '-dMonoImageResolution=72',
            '-dMonoImageDownsampleType=/Bicubic',

            // 🔥 REAL COMPRESSION: JPEG quality control
            '-dEncodeColorImages=true',
            '-dColorImageFilter=/DCTEncode',
            '-dJPEGQ=60', // 60% quality - good compression/quality balance

            // Font optimization
            '-dCompressFonts=true',
            '-dSubsetFonts=true',

            // Minor cleanup (safe flags only)
            '-dDetectDuplicateImages=true',
            '-dPreserveEPSInfo=false',
            '-dPreserveOPIComments=false',
            '-dPreserveHalftoneInfo=false',

            `-sOutputFile=${outputPath}`,
            inputPath
        ];
    }

    try {
        console.log(`🔄 Compressing PDF with quality: ${quality} (${preset})`);

        // Execute Ghostscript command
        const { stdout, stderr } = await execFileAsync(GS_COMMAND, gsArgs, {
            timeout: GS_TIMEOUT_MS // Configurable timeout (default 5 minutes)
        });

        // CRITICAL: Check for password protection even on "success"
        // Ghostscript returns exit code 0 but creates BLANK PDFs for protected files!
        if (stderr) {
            const stderrLower = stderr.toString().toLowerCase();

            if (stderrLower.includes('password') || stderrLower.includes('requires a password')) {
                console.error('⚠️  Password-protected PDF detected');
                throw new Error('PDF is password-protected or encrypted. Please remove the password before compression.');
            }

            // Log other warnings (non-fatal)
            if (stderrLower.length > 0) {
                console.warn('⚠️  Ghostscript warnings:', stderr);
            }
        }

        // Get file sizes
        const originalSize = await getFileSize(inputPath);
        const compressedSize = await getFileSize(outputPath);

        // Calculate compression ratio
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

        console.log(`✅ Compression complete: ${compressionRatio}% reduction`);

        return {
            outputPath,
            originalSize,
            compressedSize,
            compressionRatio: parseFloat(compressionRatio)
        };

    } catch (error) {
        console.error('❌ Ghostscript compression failed:', error.message);

        // Provide helpful error messages
        if (error.code === 'ENOENT') {
            throw new Error('Ghostscript is not installed. Please install Ghostscript on your system.');
        }

        // CRITICAL: Check stderr FIRST before checking timeout
        // Downsample failures cause timeouts, so we need to detect the root cause
        if (error.stderr) {
            const stderr = error.stderr.toString().toLowerCase();

            // Downsample filter failure (specific cause)
            if (stderr.includes('failed to initialise downsample filter')) {
                throw new Error('This PDF contains images that cannot be processed with current quality settings. Try using "strong" quality preset, though compression may be limited.');
            }

            // Password protection
            if (stderr.includes('password') || stderr.includes('encrypted')) {
                throw new Error('PDF is password-protected or encrypted. Please remove the password before compression.');
            }
        }

        // Timeout (generic cause - only if no specific error found)
        if (error.killed || error.code === 'ETIMEDOUT') {
            throw new Error('PDF compression timed out. This file is too complex to process in the time limit. Try using a smaller file or splitting the PDF.');
        }

        throw new Error(`PDF compression failed: ${error.message}`);
    }
}

module.exports = {
    compressPDF
};
