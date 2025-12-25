# PDF Compression API Documentation

**Base URL**: `http://localhost:5000` (Development) | `https://api.allgenztools.com` (Production)

**Version**: 1.0.0

---

## 🚀 Quick Start

```bash
# Compress a PDF with default settings (recommended quality)
curl -X POST http://localhost:5000/api/compress \
  -F "file=@document.pdf" \
  -O -J

# Compress with maximum compression (strong quality)
curl -X POST http://localhost:5000/api/compress \
  -F "file=@document.pdf" \
  -F "quality=strong" \
  -O -J
```

---

## 📡 Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "success": true,
  "message": "PDF Compression API is running",
  "timestamp": "2025-12-25T10:15:00.000Z"
}
```

**Status Codes**:
- `200 OK` - API is running

---

### 2. Compress PDF

Upload and compress a PDF file.

**Endpoint**: `POST /api/compress`

**Content-Type**: `multipart/form-data`

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | ✅ Yes | PDF file to compress (max 40MB) |
| `quality` | String | ❌ No | Compression preset: `screen`, `ebook`, `printer`, `prepress` (default: `ebook`) |

#### Quality Presets

| Preset | DPI | Use Case | Typical Compression |
|--------|-----|----------|---------------------|
| `recommended` | 150 | **Default** - Balanced quality/size | 20-60% (varies by content) |
| `strong` | 72 | Maximum compression for web viewing | 50-80% (varies by content) |
| `printer` | 300 | High quality printing (advanced) | 10-40% |
| `prepress` | 300+ | Professional printing (advanced) | 5-30% |

**Legacy names** (backward compatible): `ebook` = `recommended`, `screen` = `strong`

#### Response

**Success** - The API returns the compressed PDF file directly as a download.

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="compressed_filename.pdf"
```

#### Error Responses

**400 Bad Request** - Invalid file or parameters
```json
{
  "success": false,
  "error": "Only PDF files are allowed"
}
```

**413 Payload Too Large** - File exceeds size limit
```json
{
  "success": false,
  "error": "File size exceeds the limit of 40 MB"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 5 requests allowed per 10 minutes.",
  "retryAfter": 600
}
```

**500 Internal Server Error** - Compression failed
```json
{
  "success": false,
  "error": "PDF compression failed: [error details]"
}
```

---

## 💻 Code Examples

### JavaScript (Fetch API)

```javascript
async function compressPDF(file, quality = 'ebook') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('quality', quality);

  try {
    const response = await fetch('http://localhost:5000/api/compress', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    // Download the compressed file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${file.name}`;
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Compression failed:', error);
  }
}
```

### JavaScript (Axios)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function compressPDF(filePath, quality = 'ebook') {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('quality', quality);

  try {
    const response = await axios.post(
      'http://localhost:5000/api/compress',
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'stream'
      }
    );

    // Save compressed file
    response.data.pipe(fs.createWriteStream('compressed_output.pdf'));
    console.log('✅ Compression complete');

  } catch (error) {
    console.error('❌ Compression failed:', error.response?.data || error.message);
  }
}
```

### Python (Requests)

```python
import requests

def compress_pdf(file_path, quality='ebook'):
    url = 'http://localhost:5000/api/compress'
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'quality': quality}
        
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            # Save compressed file
            with open('compressed_output.pdf', 'wb') as output:
                output.write(response.content)
            print('✅ Compression complete')
        else:
            error = response.json()
            print(f'❌ Error: {error["error"]}')

# Usage
compress_pdf('document.pdf', 'ebook')
```

### cURL

```bash
# Basic compression
curl -X POST http://localhost:5000/api/compress \
  -F "file=@document.pdf" \
  -O -J

# With quality preset
curl -X POST http://localhost:5000/api/compress \
  -F "file=@/path/to/document.pdf" \
  -F "quality=screen" \
  -o compressed_output.pdf

# Windows CMD
curl -X POST http://localhost:5000/api/compress ^
  -F "file=@document.pdf" ^
  -F "quality=ebook" ^
  -O -J
```

### PHP

```php
<?php
function compressPDF($filePath, $quality = 'ebook') {
    $url = 'http://localhost:5000/api/compress';
    
    $file = new CURLFile($filePath, 'application/pdf', basename($filePath));
    
    $data = [
        'file' => $file,
        'quality' => $quality
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        file_put_contents('compressed_output.pdf', $response);
        echo "✅ Compression complete\n";
    } else {
        $error = json_decode($response, true);
        echo "❌ Error: " . $error['error'] . "\n";
    }
}

compressPDF('document.pdf', 'ebook');
?>
```

---

## 🔒 Rate Limiting

**Limits**: 5 requests per IP per 10 minutes

**Headers** (included in all responses):
```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1640435400
```

**When limit exceeded**:
- Status: `429 Too Many Requests`
- Response includes `retryAfter` (seconds until reset)

---

## 📊 Compression Details

### Safe Mode (ebook, printer, prepress)

**Optimizations**:
- Basic PDF compression
- Font subsetting
- Standard Ghostscript presets
- **No quality loss**

**Typical Results**:
- Text-heavy PDFs: 10-30% reduction
- Mixed content: 20-50% reduction
- Image-heavy: 30-60% reduction

### Aggressive Mode (screen)

**Optimizations**:
- Image downsampling to 72 DPI
- JPEG quality reduction (60%)
- Duplicate image detection
- Metadata stripping

**Typical Results**:
- Text-heavy PDFs: 30-50% reduction
- Mixed content: 50-70% reduction
- Image-heavy: 60-85% reduction

**⚠️ Trade-off**: Lower image quality (suitable for web viewing only)

---

## 🚨 Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| "Only PDF files are allowed" | 400 | Wrong file type | Upload PDF files only |
| "File size exceeds limit" | 400 | File > 40MB | Reduce file size or split |
| "Rate limit exceeded" | 429 | Too many requests | Wait 10 minutes |
| "Ghostscript not installed" | 500 | Missing dependency | Install Ghostscript on server |
| "PDF compression failed" | 500 | Corrupted/encrypted PDF | Use valid, non-encrypted PDF |

### Best Practices

1. **Always validate file type** before uploading
2. **Check file size** (max 40MB)
3. **Handle rate limits** gracefully (implement retry with backoff)
4. **Catch errors** and provide user feedback
5. **Test with sample PDFs** before production use

---

## 🔐 Security

### File Privacy
- ✅ Files deleted immediately after download
- ✅ No file storage or logging
- ✅ No tracking or analytics
- ✅ CORS-enabled for trusted origins

### Best Practices
- Use HTTPS in production
- Validate file types on client side
- Implement authentication if building private service
- Monitor for abuse

---

## 🌍 CORS

**Allowed Origins** (configurable via `.env`):
```env
CORS_ORIGIN=https://yourdomain.com
```

**Allowed Methods**: `GET, POST`

**Allowed Headers**: `Content-Type`

---

## 📈 Performance

### Response Times
- Small PDFs (<1MB): 2-5 seconds
- Medium PDFs (1-10MB): 5-15 seconds
- Large PDFs (10-40MB): 15-30 seconds

### Optimization Tips
1. Use `screen` preset for fastest compression
2. Compress files during off-peak hours if possible
3. Consider client-side pre-validation to reduce failed requests

---

## 🛠️ Self-Hosting

### Requirements
- Node.js 18+
- Ghostscript
- 512MB RAM minimum

### Installation

```bash
# Clone repository
git clone <your-repo-url> pdf-compress-backend
cd pdf-compress-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Start server
npm start
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MAX_FILE_SIZE_MB` | 40 | Max upload size |
| `CORS_ORIGIN` | http://localhost:8080 | Allowed frontend URL |
| `RATE_LIMIT_MAX_REQUESTS` | 5 | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | 600000 | Rate limit window (10 min) |

---

## 📞 Support

- **Issues**: Report bugs or request features
- **Email**: hello@allgenztools.com
- **Documentation**: Full README in repository

---

## 📄 License

MIT License - Free to use and modify

---

## 🔄 Changelog

### v1.0.0 (2025-12-25)
- Initial release
- Two-pipeline compression architecture
- Smart compression feedback
- Rate limiting
- Auto cleanup
