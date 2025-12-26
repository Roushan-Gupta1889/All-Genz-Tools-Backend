# Use official Node.js 18 image with Debian (has apt-get for installing Ghostscript)
FROM node:18-bullseye

# Install Ghostscript (required for PDF compression)
RUN apt-get update && \
    apt-get install -y ghostscript && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy all application code
COPY . .

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs

# Expose port 5000 (your backend runs on this port)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
