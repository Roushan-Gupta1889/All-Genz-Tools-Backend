# 📘 PDF Compression Backend API

Privacy-first PDF compression API using Ghostscript. Built with Node.js and Express.

## Features

- 🔒 **Privacy-First**: Automatic file deletion after processing
- ⚡ **Fast Compression**: Powered by Ghostscript
- 🎨 **4 Quality Presets**: Recommended, Strong, Printer, Professional
- 🛡️ **Rate Limiting**: Protection against abuse
- 📦 **File Size Limit**: 50MB (configurable)
- ⏱️ **Smart Timeout**: 2-minute processing limit
- 🧹 **Auto-Cleanup**: Files deleted after 2 minutes

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Compression**: Ghostscript
- **File Upload**: Multer
- **Security**: CORS, Rate Limiting

## Prerequisites

- Node.js 18 or higher
- Ghostscript installed on your system
- npm or yarn

### Installing Ghostscript

**Windows:**
Download from [https://ghostscript.com/releases/gsdnld.html](https://ghostscript.com/releases/gsdnld.html)

**macOS:**
```bash
brew install ghostscript
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ghostscript
```

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pdf-compress-backend.git
cd pdf-compress-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start development server
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Limits
MAX_FILE_SIZE_MB=50

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000        # 10 minutes
RATE_LIMIT_MAX_REQUESTS=3          # Requests per window

# Cleanup Configuration
CLEANUP_INTERVAL_MS=60000          # 1 minute
FILE_MAX_AGE_MS=120000             # 2 minutes

# Ghostscript Configuration
GS_COMPRESSION_PRESET=ebook
GS_TIMEOUT_MS=120000               # 2 minutes
```

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Compress PDF
```http
POST /api/compress
Content-Type: multipart/form-data

Parameters:
- file: PDF file (max 50MB)
- quality: recommended | strong | printer | prepress
```

**Success Response:**
```
Content-Type: application/pdf
X-Original-Size: 1048576
X-Compressed-Size: 524288
X-Compression-Ratio: 50

[Binary PDF data]
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## Quality Presets

| Preset | Description | Use Case | Compression |
|--------|-------------|----------|-------------|
| `recommended` | Balanced quality & size | General use | ~55% |
| `strong` | Maximum compression | Sharing online | ~65% |
| `printer` | High quality | Printing | ~40% |
| `prepress` | Professional | Print shops | ~25% |

## Project Structure

```
pdf-compress-backend/
├── src/
│   ├── server.js              # Entry point
│   ├── config/
│   │   └── constants.js       # Configuration
│   ├── controllers/
│   │   └── compress.controller.js
│   ├── services/
│   │   └── ghostscript.service.js
│   ├── middleware/
│   │   └── rateLimiter.js
│   └── utils/
│       ├── cleanup.js
│       └── fileManager.js
├── uploads/                   # Temporary uploads
├── outputs/                   # Temporary outputs
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name pdf-api

# Save PM2 configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 55M;
    }
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid file, etc.)
- `413` - Payload Too Large (file > 50MB)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security Features

- ✅ CORS protection
- ✅ Rate limiting (3 requests per 10 minutes)
- ✅ File type validation
- ✅ File size limits
- ✅ Automatic file cleanup
- ✅ No file storage (privacy-first)

## Performance

**Average Processing Times:**
- Small PDFs (< 5MB): 2-10 seconds
- Medium PDFs (5-30MB): 30-60 seconds
- Large PDFs (30-50MB): 60-120 seconds

**Resource Requirements:**
- VPS: 512MB RAM minimum
- CPU: 1 core minimum
- Storage: 1GB (for temporary files)

## Troubleshooting

### Ghostscript not found
Ensure Ghostscript is installed and in your system PATH.

### Files not being deleted
Check `CLEANUP_INTERVAL_MS` and `FILE_MAX_AGE_MS` in your `.env` file.

### Timeout errors
Large or complex PDFs may exceed the 2-minute timeout. Consider:
- Using "strong" quality for faster processing
- Reducing file size before compression
- Increasing `GS_TIMEOUT_MS` (not recommended for production)

## Frontend Integration

This backend works with the [Swift Compress Frontend](https://github.com/yourusername/swift-compress).

## License

MIT

## Author

All Genz Tools

## Support

For issues and questions, please open an issue on GitHub.
